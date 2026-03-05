const db = require('../config/db');
const { getOrCreatePatientIdByUserId } = require('../utils/patientAutoLink');

// Walk-in patient records by name + contact (no user_id)
const getWalkInRecords = (req, res) => {
    const { patient_name, contact_number } = req.query;
    if (!patient_name || !contact_number) {
        return res.status(400).json({ error: 'patient_name and contact_number are required' });
    }

    const sql = `
    SELECT mn.*, b.date as appointment_date, b.time_slot, b.service_type
    FROM medical_notes mn
    JOIN booking b ON mn.booking_id = b.id
    WHERE (b.user_id IS NULL OR b.user_id = 0)
      AND b.patient_name = ? AND b.contact_number = ?
    ORDER BY b.date DESC, b.time_slot ASC
  `;

    db.query(sql, [patient_name, contact_number], (err, results) => {
        if (err) {
            console.error('Database error getWalkInRecords:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const records = results.map(r => {
            if (r.vital_signs) {
                try { r.vital_signs = JSON.parse(r.vital_signs); } catch { r.vital_signs = null; }
            }
            return r;
        });
        res.json(records);
    });
};

// Add or update vital signs by Staff/Admin (triage step)
const addOrUpdateVitalsByStaff = (req, res) => {
    const { booking_id, patient_id, vital_signs } = req.body;

    if (!booking_id) {
        return res.status(400).json({ error: "Missing required field: booking_id" });
    }

    // Verify the appointment exists and get possible patient_id
    const verifyAppointmentSql = `
        SELECT b.*, p.id as patient_table_id FROM booking b
        LEFT JOIN patients p ON (
          p.user_id = b.user_id OR (
            (b.user_id IS NULL OR b.user_id = 0)
            AND p.phone = b.contact_number
            AND TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = b.patient_name
          )
        )
        WHERE b.id = ?
    `;

    db.query(verifyAppointmentSql, [booking_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const appointment = results[0];

        // Safety net: if online user has no patient row yet, create one now
        if (appointment.user_id && !appointment.patient_table_id) {
            const upsertSql = `
              INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, gender)
              SELECT u.id, SUBSTRING_INDEX(u.email,'@',1), NULL, '', u.email, '00000000000', 'female'
              FROM users u
              LEFT JOIN patients p ON p.user_id = u.id
              WHERE u.id = ? AND p.user_id IS NULL
            `;
            db.query(upsertSql, [appointment.user_id], (upErr) => {
                if (upErr) {
                    console.error('Error upserting patient on vitals:', upErr);
                }
            });
        }

        const actualPatientId = patient_id || appointment.patient_table_id || null;
        const vitalSignsJson = vital_signs ? JSON.stringify(vital_signs) : null;

        // Check if medical notes already exist for this appointment
        const checkExistingSql = "SELECT id FROM medical_notes WHERE booking_id = ?";
        db.query(checkExistingSql, [booking_id], (checkErr, existing) => {
            if (checkErr) {
                console.error("Database error:", checkErr);
                return res.status(500).json({ error: "Database error" });
            }

            if (existing.length > 0) {
                // Update ONLY vital_signs to avoid overwriting doctor's entries
                const updateSql = `
                    UPDATE medical_notes 
                    SET vital_signs = ?, updated_at = NOW()
                    WHERE booking_id = ?
                `;
                db.query(updateSql, [vitalSignsJson, booking_id], (updateErr) => {
                    if (updateErr) {
                        console.error("Database error:", updateErr);
                        return res.status(500).json({ error: "Error updating vital signs" });
                    }
                    return res.json({ message: "Vital signs updated successfully" });
                });
            } else {
                // Insert new row with vital_signs only; other fields left NULL
                let insertSql;
                let insertParams;
                if (actualPatientId) {
                    insertSql = `
                        INSERT INTO medical_notes 
                        (booking_id, patient_id, vital_signs)
                        VALUES (?, ?, ?)
                    `;
                    insertParams = [booking_id, actualPatientId, vitalSignsJson];
                } else {
                    insertSql = `
                        INSERT INTO medical_notes 
                        (booking_id, vital_signs)
                        VALUES (?, ?)
                    `;
                    insertParams = [booking_id, vitalSignsJson];
                }
                db.query(insertSql, insertParams, (insertErr) => {
                    if (insertErr) {
                        console.error("Database error:", insertErr);
                        return res.status(500).json({ error: "Error saving vital signs" });
                    }
                    return res.json({ message: "Vital signs saved successfully" });
                });
            }
        });
    });
};

const clinicEnhancementsController = require('./clinicEnhancementsController');

// Helper to promisify integration callbacks
const runIntegration = (fn, payload) => {
    return new Promise((resolve) => {
        try {
            fn(payload, (err, result) => {
                if (err) {
                    console.error('Integration error:', err);
                    return resolve({ ok: false, error: err });
                }
                resolve({ ok: true, id: result?.insertId });
            });
        } catch (e) {
            console.error('Integration exception:', e);
            resolve({ ok: false, error: e });
        }
    });
};

// Apply optional structured updates linked to the same booking/patient
const applyStructuredUpdates = async (appointment, actualPatientId, updates) => {
    if (!updates || typeof updates !== 'object') return {};

    const base = {
        patient_id: actualPatientId || null,
        booking_id: appointment.id,
        appointment_date: appointment.date,
    };

    const results = {};

    // Family Planning (single object)
    if (updates.family_planning) {
        const fp = updates.family_planning;
        results.family_planning = await runIntegration(
            clinicEnhancementsController.addFamilyPlanningFromMedicalNotes,
            {
                ...base,
                method_type: fp.method_type,
                method_details: fp.method_details,
                counseling_notes: fp.counseling_notes,
                follow_up_date: fp.follow_up_date,
            }
        );
    }

    // Lab Results (array or single)
    if (updates.lab_results) {
        const labItems = Array.isArray(updates.lab_results) ? updates.lab_results : [updates.lab_results];
        results.lab_results = [];
        for (const lr of labItems) {
            results.lab_results.push(
                await runIntegration(
                    clinicEnhancementsController.addLabResultFromMedicalNotes,
                    {
                        ...base,
                        test_type: lr.test_type,
                        test_category: lr.test_category,
                        test_date: lr.test_date,
                        result_value: lr.result_value,
                        unit: lr.unit,
                        reference_range: lr.reference_range,
                        interpretation: lr.interpretation,
                        notes: lr.notes,
                    }
                )
            );
        }
    }

    // Prenatal (single)
    if (updates.prenatal) {
        const pr = updates.prenatal;
        const cc = String(pr.cycle_choice || '').toLowerCase();
        const pickPid = () => new Promise((resolvePid) => {
            if (cc === 'new' || cc === 'current') {
                const maxSql = 'SELECT MAX(pregnancy_id) AS max_pid FROM prenatal_schedule WHERE patient_id = ?';
                db.query(maxSql, [base.patient_id], (mErr, mRows) => {
                    if (mErr) return resolvePid(null);
                    const maxPid = (mRows && mRows[0] && mRows[0].max_pid) ? Number(mRows[0].max_pid) : null;
                    const pid = cc === 'new' ? (maxPid || 0) + 1 : (maxPid || 1);
                    resolvePid(pid);
                });
            } else {
                resolvePregnancyIdForDateLocal(base.patient_id, base.appointment_date, (rErr, pid) => {
                    if (rErr) return resolvePid(null);
                    resolvePid(pid);
                });
            }
        });
        const pid = await pickPid();
        await new Promise((resolveInsert) => {
            const sql = `INSERT INTO prenatal_schedule (
                patient_id, booking_id, pregnancy_id,
                gestational_age, fundal_height_cm, fetal_heart_rate, blood_pressure, weight_kg,
                temperature_c, maternal_heart_rate, respiratory_rate,
                complaints, assessment, plan, visit_notes,
                next_visit_date, visit_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                base.patient_id,
                base.booking_id,
                pid,
                pr.gestational_age || null,
                pr.fundal_height_cm || null,
                pr.fetal_heart_rate || null,
                pr.blood_pressure || null,
                pr.weight_kg || null,
                pr.temperature_c || null,
                pr.maternal_heart_rate || null,
                pr.respiratory_rate || null,
                null,
                pr.risk_assessment || null,
                (pr.recommendations || pr.next_visit_plan || null),
                pr.prenatal_findings || null,
                pr.next_visit_date || null,
                base.appointment_date
            ];
            db.query(sql, params, (insertErr, result) => {
                results.prenatal = insertErr ? { ok: false, error: insertErr } : { ok: true, id: result?.insertId };
                resolveInsert();
            });
        });
    }

    // Postpartum (single)
    if (updates.postpartum) {
        const pp = updates.postpartum;
        results.postpartum = await runIntegration(
            clinicEnhancementsController.addPostpartumAssessmentFromMedicalNotes,
            {
                ...base,
                postpartum_findings: pp.postpartum_findings,
                recovery_status: pp.recovery_status,
                next_visit_plan: pp.next_visit_plan,
            }
        );
    }

    // Screenings (array or single)
    if (updates.screenings) {
        const scItems = Array.isArray(updates.screenings) ? updates.screenings : [updates.screenings];
        results.screenings = [];
        for (const sc of scItems) {
            results.screenings.push(
                await runIntegration(
                    clinicEnhancementsController.addScreeningFromMedicalNotes,
                    {
                        ...base,
                        screening_type: sc.screening_type,
                        screening_results: sc.screening_results,
                        recommendations: sc.recommendations,
                    }
                )
            );
        }
    }

    // Procedures (array or single)
    if (updates.procedures) {
        const procItems = Array.isArray(updates.procedures) ? updates.procedures : [updates.procedures];
        results.procedures = [];
        for (const p of procItems) {
            results.procedures.push(
                await runIntegration(
                    clinicEnhancementsController.addProcedureFromMedicalNotes,
                    {
                        ...base,
                        procedure_type: p.procedure_type,
                        procedure_performed: p.procedure_performed,
                        procedure_notes: p.procedure_notes,
                    }
                )
            );
        }
    }

    // Immunizations (array or single)
    if (updates.immunizations) {
        const imItems = Array.isArray(updates.immunizations) ? updates.immunizations : [updates.immunizations];
        results.immunizations = [];
        for (const im of imItems) {
            results.immunizations.push(
                await runIntegration(
                    clinicEnhancementsController.addImmunizationFromMedicalNotes,
                    {
                        ...base,
                        vaccines_given: im.vaccines_given,
                        vaccine_batch: im.vaccine_batch,
                        next_dose_date: im.next_dose_date,
                    }
                )
            );
        }
    }

    return results;
};

// Add medical notes after completing an appointment
const addMedicalNotes = (req, res) => {
    const {
        booking_id,
        patient_id,
        doctor_notes,
        diagnosis,
        treatment_given,
        recommendations,
        next_appointment_suggestion,
        vital_signs,
        structured_updates,
        linked_records // alias accepted for convenience
    } = req.body;

    if (!booking_id || !doctor_notes) {
        return res.status(400).json({ error: "Missing required fields: booking_id and doctor_notes" });
    }

    // First verify the appointment exists (remove completed check since we want to allow saving during completion)
    const verifyAppointmentSql = `
        SELECT b.*, p.id as patient_table_id FROM booking b
        LEFT JOIN patients p ON (
          p.user_id = b.user_id OR (
            (b.user_id IS NULL OR b.user_id = 0)
            AND p.phone = b.contact_number
            AND TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = b.patient_name
          )
        )
        WHERE b.id = ?
    `;

    db.query(verifyAppointmentSql, [booking_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const appointment = results[0];

        // Safety net: if online user has no patient row yet, create one now
        if (appointment.user_id && !appointment.patient_table_id) {
            const upsertSql = `
              INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, gender)
              SELECT u.id, SUBSTRING_INDEX(u.email,'@',1), NULL, '', u.email, '00000000000', 'female'
              FROM users u
              LEFT JOIN patients p ON p.user_id = u.id
              WHERE u.id = ? AND p.user_id IS NULL
            `;
            db.query(upsertSql, [appointment.user_id], (upErr) => {
                if (upErr) {
                    console.error('Error upserting patient on medical notes:', upErr);
                }
            });
        }

        // Resolve a patient_id and proceed with insert/update, ensuring linkage
        const proceedWithPatient = (resolvedPatientId) => {
            const actualPatientId = resolvedPatientId;

            // Check if medical notes already exist for this appointment
            const checkExistingSql = "SELECT id FROM medical_notes WHERE booking_id = ?";
            db.query(checkExistingSql, [booking_id], (checkErr, existing) => {
                if (checkErr) {
                    console.error("Database error:", checkErr);
                    return res.status(500).json({ error: "Database error" });
                }

                const vitalSignsJson = vital_signs ? JSON.stringify(vital_signs) : null;

                if (existing.length > 0) {
                    // Update and back-fill missing patient_id if needed
                    const updateSql = `
                        UPDATE medical_notes 
                        SET patient_id = COALESCE(patient_id, ?),
                            doctor_notes = ?, diagnosis = ?, treatment_given = ?, 
                            recommendations = ?, next_appointment_suggestion = ?, 
                            vital_signs = ?, updated_at = NOW()
                        WHERE booking_id = ?
                    `;

                    db.query(updateSql, [
                        actualPatientId,
                        doctor_notes, diagnosis, treatment_given,
                        recommendations, next_appointment_suggestion,
                        vitalSignsJson, booking_id
                    ], async (updateErr) => {
                        if (updateErr) {
                            console.error("Database error:", updateErr);
                            return res.status(500).json({ error: "Error updating medical notes" });
                        }
                        // If doctor suggested a specific date (YYYY-MM-DD), seed availability for that day and auto-schedule a follow-up
                        if (isValidYYYYMMDD(next_appointment_suggestion)) {
                            // Helper: attempt to auto-schedule follow-up linked to this appointment
                            const autoScheduleFollowUp = (dateStr, done) => {
                                if (!dateStr) return done(null);

                                // Avoid duplicate auto-booking for the same suggestion
                                const checkExistingSql = `SELECT id FROM booking WHERE follow_up_of_booking_id = ? AND date = ? LIMIT 1`;
                                db.query(checkExistingSql, [appointment.id, dateStr], (chkErr, chkRows) => {
                                    if (chkErr) {
                                        console.error('Auto-schedule check error:', chkErr);
                                        return done(null);
                                    }
                                    if (chkRows && chkRows.length > 0) {
                                        // Already scheduled
                                        return done(chkRows[0].id);
                                    }

                                    const serviceName = appointment.service_type || 'General Checkup';
                                    const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
                                    db.query(svcSql, [serviceName], (svcErr, svcRows) => {
                                        if (svcErr) {
                                            console.error('Auto-schedule services error:', svcErr);
                                            return done(null);
                                        }
                                        const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
                                        const requiredSlots = getRequiredSlotsForDuration(duration);

                                        let idx = 0;
                                        const tryNext = () => {
                                            if (idx >= SLOT_SEQUENCE.length) return done(null);
                                            const baseSlot = SLOT_SEQUENCE[idx];
                                            const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
                                            // If we can't fit required consecutive slots starting at baseSlot, skip
                                            if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) {
                                                idx += 1;
                                                return tryNext();
                                            }
                                            // Check for conflicts across all needed slots on the date
                                            const placeholders = consecutiveSlots.map(() => '?').join(',');
                                            const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
                                            db.query(conflictSql, [dateStr, ...consecutiveSlots], (confErr, confRows) => {
                                                if (confErr) {
                                                    console.error('Auto-schedule conflict check error:', confErr);
                                                    idx += 1;
                                                    return tryNext();
                                                }
                                                const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                                                if (hasConflict) {
                                                    idx += 1;
                                                    return tryNext();
                                                }

                                                // Insert new booking linked to current appointment
                                                const insertSql = `
                                        INSERT INTO booking 
                                          (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                                        VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, ?, ?)
                                      `;
                                                const userId = appointment.user_id || null;
                                                const patientName = appointment.patient_name;
                                                const contactNumber = appointment.contact_number;
                                                db.query(
                                                    insertSql,
                                                    [userId, patientName, contactNumber, serviceName, dateStr, baseSlot, appointment.id, dateStr],
                                                    (insErr, insRes) => {
                                                        if (insErr) {
                                                            console.error('Auto-schedule insert error:', insErr);
                                                            idx += 1;
                                                            return tryNext();
                                                        }
                                                        const newId = insRes.insertId;
                                                        // Mark each involved slot as booked in slots table
                                                        return done(newId);
                                                    }
                                                );
                                            });
                                        };
                                        tryNext();
                                    });
                                });
                            };

                            return ensureDayAvailable(next_appointment_suggestion, async () => {
                                const updatesPayload = structured_updates || linked_records;
                                let integrationSummary = {};
                                try {
                                    integrationSummary = await applyStructuredUpdates(appointment, actualPatientId, updatesPayload);
                                } catch (e) {
                                    console.error('Error applying structured updates:', e);
                                }
                                autoScheduleFollowUp(next_appointment_suggestion, (createdId) => {
                                    res.json({
                                        message: "Medical notes updated successfully",
                                        integrations: integrationSummary,
                                        auto_scheduled_followup_booking_id: createdId || null
                                    });
                                });
                            });
                        }
                        // Apply optional structured updates
                        const updatesPayload = structured_updates || linked_records;
                        let integrationSummary = {};
                        try {
                            integrationSummary = await applyStructuredUpdates(appointment, actualPatientId, updatesPayload);
                        } catch (e) {
                            console.error('Error applying structured updates:', e);
                        }
                        res.json({ message: "Medical notes updated successfully", integrations: integrationSummary });
                    });
                } else {
                    // Insert new notes - handle null patient_id for walk-ins
                    let insertSql, insertParams;

                    if (actualPatientId) {
                        insertSql = `
                            INSERT INTO medical_notes 
                            (booking_id, patient_id, doctor_notes, diagnosis, treatment_given, 
                             recommendations, next_appointment_suggestion, vital_signs)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        insertParams = [
                            booking_id, actualPatientId, doctor_notes, diagnosis, treatment_given,
                            recommendations, next_appointment_suggestion, vitalSignsJson
                        ];
                    } else {
                        // For walk-in patients without patient_id
                        insertSql = `
                            INSERT INTO medical_notes 
                            (booking_id, doctor_notes, diagnosis, treatment_given, 
                             recommendations, next_appointment_suggestion, vital_signs)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `;
                        insertParams = [
                            booking_id, doctor_notes, diagnosis, treatment_given,
                            recommendations, next_appointment_suggestion, vitalSignsJson
                        ];
                    }

                    db.query(insertSql, insertParams, async (insertErr, insertResult) => {
                        if (insertErr) {
                            console.error("Database error:", insertErr);
                            return res.status(500).json({ error: "Error saving medical notes" });
                        }
                        // If doctor suggested a specific date (YYYY-MM-DD), seed availability for that day and auto-schedule a follow-up
                        if (isValidYYYYMMDD(next_appointment_suggestion)) {
                            // Helper: attempt to auto-schedule follow-up linked to this appointment
                            const autoScheduleFollowUp = (dateStr, done) => {
                                if (!dateStr) return done(null);

                                const checkExistingSql = `SELECT id FROM booking WHERE follow_up_of_booking_id = ? AND date = ? LIMIT 1`;
                                db.query(checkExistingSql, [appointment.id, dateStr], (chkErr, chkRows) => {
                                    if (chkErr) {
                                        console.error('Auto-schedule check error:', chkErr);
                                        return done(null);
                                    }
                                    if (chkRows && chkRows.length > 0) {
                                        return done(chkRows[0].id);
                                    }

                                    const serviceName = appointment.service_type || 'General Checkup';
                                    const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
                                    db.query(svcSql, [serviceName], (svcErr, svcRows) => {
                                        if (svcErr) {
                                            console.error('Auto-schedule services error:', svcErr);
                                            return done(null);
                                        }
                                        const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
                                        const requiredSlots = getRequiredSlotsForDuration(duration);

                                        let idx = 0;
                                        const tryNext = () => {
                                            if (idx >= SLOT_SEQUENCE.length) return done(null);
                                            const baseSlot = SLOT_SEQUENCE[idx];
                                            const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
                                            if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) {
                                                idx += 1;
                                                return tryNext();
                                            }
                                            const placeholders = consecutiveSlots.map(() => '?').join(',');
                                            const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
                                            db.query(conflictSql, [dateStr, ...consecutiveSlots], (confErr, confRows) => {
                                                if (confErr) {
                                                    console.error('Auto-schedule conflict check error:', confErr);
                                                    idx += 1;
                                                    return tryNext();
                                                }
                                                const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                                                if (hasConflict) {
                                                    idx += 1;
                                                    return tryNext();
                                                }

                                                const insertSql = `
                                        INSERT INTO booking 
                                          (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                                        VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, ?, ?)
                                      `;
                                                const userId = appointment.user_id || null;
                                                const patientName = appointment.patient_name;
                                                const contactNumber = appointment.contact_number;
                                                db.query(
                                                    insertSql,
                                                    [userId, patientName, contactNumber, serviceName, dateStr, baseSlot, appointment.id, dateStr],
                                                    (insErr, insRes) => {
                                                        if (insErr) {
                                                            console.error('Auto-schedule insert error:', insErr);
                                                            idx += 1;
                                                            return tryNext();
                                                        }
                                                        const newId = insRes.insertId;
                                                        return done(newId);
                                                    }
                                                );
                                            });
                                        };
                                        tryNext();
                                    });
                                });
                            };

                            return ensureDayAvailable(next_appointment_suggestion, async () => {
                                const updatesPayload = structured_updates || linked_records;
                                let integrationSummary = {};
                                try {
                                    integrationSummary = await applyStructuredUpdates(appointment, actualPatientId, updatesPayload);
                                } catch (e) {
                                    console.error('Error applying structured updates:', e);
                                }
                                autoScheduleFollowUp(next_appointment_suggestion, (createdId) => {
                                    res.json({
                                        message: "Medical notes saved successfully",
                                        integrations: integrationSummary,
                                        auto_scheduled_followup_booking_id: createdId || null
                                    });
                                });
                            });
                        }
                        // Apply optional structured updates
                        const updatesPayload = structured_updates || linked_records;
                        let integrationSummary = {};
                        try {
                            integrationSummary = await applyStructuredUpdates(appointment, actualPatientId, updatesPayload);
                        } catch (e) {
                            console.error('Error applying structured updates:', e);
                        }

                        res.json({ message: "Medical notes saved successfully", integrations: integrationSummary });
                    });
                }
            });
        };

        // Determine patient_id priority: explicit param -> joined patient -> auto-link via user_id
        if (patient_id) {
            proceedWithPatient(patient_id);
        } else if (appointment.patient_table_id) {
            proceedWithPatient(appointment.patient_table_id);
        } else if (appointment.user_id) {
            getOrCreatePatientIdByUserId(appointment.user_id)
                .then((newPatientId) => proceedWithPatient(newPatientId))
                .catch((autoErr) => {
                    console.error('Auto-link error in addMedicalNotes:', autoErr);
                    proceedWithPatient(null);
                });
        } else {
            // Walk-in cases: create/find patient record to enable proper prenatal/postpartum tracking
            if (appointment.patient_name && appointment.contact_number) {
                const tokens = String(appointment.patient_name).split(' ').filter(Boolean);
                const firstName = tokens[0] || '';
                const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
                const middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;

                // Try to find existing patient first
                const findWalkInSql = `
                    SELECT id FROM patients 
                    WHERE phone = ? 
                    AND TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ?
                    LIMIT 1
                `;
                db.query(findWalkInSql, [appointment.contact_number, appointment.patient_name], (findErr, findRows) => {
                    if (findErr) {
                        console.error('Error finding walk-in patient:', findErr);
                        return proceedWithPatient(null);
                    }

                    if (findRows && findRows.length > 0) {
                        // Patient found
                        return proceedWithPatient(findRows[0].id);
                    }

                    // Patient not found, create new record
                    const placeholderEmail = `walkin_${appointment.contact_number}@placeholder.local`;
                    const createWalkInSql = `
                        INSERT INTO patients (first_name, middle_name, last_name, phone, email, gender)
                        VALUES (?, ?, ?, ?, ?, 'unspecified')
                    `;
                    db.query(createWalkInSql, [firstName, middleName, lastName, appointment.contact_number, placeholderEmail], (createErr, createRes) => {
                        if (createErr) {
                            console.error('Error creating walk-in patient for medical notes:', createErr);
                            return proceedWithPatient(null);
                        }
                        return proceedWithPatient(createRes.insertId);
                    });
                });
            } else {
                // No patient info available
                proceedWithPatient(null);
            }
        }
    });
};

// Get medical notes for a specific appointment
const getMedicalNotesByAppointment = (req, res) => {
    const { booking_id } = req.params;

    const sql = `
        SELECT mn.*, b.date as appointment_date, b.time_slot, b.service_type,
               TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) as patient_name
        FROM medical_notes mn
        JOIN booking b ON mn.booking_id = b.id
        LEFT JOIN patients p ON mn.patient_id = p.id
        WHERE mn.booking_id = ?
    `;

    db.query(sql, [booking_id], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            // Return an empty baseline object instead of 404 so clients can prefill gracefully
            return res.json({
                booking_id: Number(booking_id),
                doctor_notes: '',
                diagnosis: '',
                treatment_given: '',
                recommendations: '',
                next_appointment_suggestion: '',
                vital_signs: null,
                linked_records: {
                    family_planning: null,
                    lab_results: [],
                    prenatal_schedule: null,
                    postpartum_care: null,
                    screenings: [],
                    procedures: [],
                    immunizations: [],
                }
            });
        }

        // Parse vital_signs JSON if it exists
        const medicalNote = results[0];
        if (medicalNote.vital_signs) {
            try {
                medicalNote.vital_signs = JSON.parse(medicalNote.vital_signs);
            } catch (parseErr) {
                console.error("Error parsing vital signs:", parseErr);
                medicalNote.vital_signs = null;
            }
        }
        // Fetch linked structured records by booking_id
        const linked = {
            family_planning: null,
            lab_results: [],
            prenatal_schedule: null,
            postpartum_care: null,
            screenings: [],
            procedures: [],
            immunizations: [],
        };

        const q = (sql, params) => new Promise((resolve) => {
            db.query(sql, params, (qe, rows) => {
                if (qe) {
                    console.error('Linked records fetch error:', qe);
                    return resolve([]);
                }
                resolve(rows || []);
            });
        });

        try {
            linked.family_planning = (await q(
                'SELECT * FROM family_planning WHERE booking_id = ? LIMIT 1',
                [booking_id]
            ))[0] || null;

            linked.lab_results = await q(
                'SELECT * FROM lab_results WHERE booking_id = ? ORDER BY id DESC',
                [booking_id]
            );

            linked.prenatal_schedule = (await q(
                'SELECT * FROM prenatal_schedule WHERE booking_id = ? LIMIT 1',
                [booking_id]
            ))[0] || null;

            linked.postpartum_care = (await q(
                'SELECT * FROM postpartum_care WHERE booking_id = ? LIMIT 1',
                [booking_id]
            ))[0] || null;

            linked.screenings = await q(
                'SELECT * FROM screenings WHERE booking_id = ? ORDER BY id DESC',
                [booking_id]
            );

            linked.procedures = await q(
                'SELECT * FROM procedures WHERE booking_id = ? ORDER BY id DESC',
                [booking_id]
            );

            linked.immunizations = await q(
                'SELECT * FROM immunizations WHERE booking_id = ? ORDER BY id DESC',
                [booking_id]
            );
        } catch (e) {
            console.error('Error building linked records:', e);
        }

        res.json({ ...medicalNote, linked_records: linked });
    });
};

// Get patient's complete medical history
const getPatientMedicalHistory = (req, res) => {
    const { patient_id } = req.params;

    const sql = `
        SELECT mn.*, b.date as appointment_date, b.time_slot, b.service_type
        FROM medical_notes mn
        JOIN booking b ON mn.booking_id = b.id
        WHERE mn.patient_id = ?
        ORDER BY b.date DESC, b.time_slot ASC
    `;

    db.query(sql, [patient_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // Parse vital_signs JSON for each record
        const medicalHistory = results.map(record => {
            if (record.vital_signs) {
                try {
                    record.vital_signs = JSON.parse(record.vital_signs);
                } catch (parseErr) {
                    console.error("Error parsing vital signs:", parseErr);
                    record.vital_signs = null;
                }
            }
            return record;
        });

        res.json(medicalHistory);
    });
};

// Get patient's medical history by user_id (for patient access)
const getMyMedicalHistory = (req, res) => {
    const userId = req.user.id;
    getOrCreatePatientIdByUserId(userId)
        .then((patientId) => {
            const sql = `
            SELECT mn.*, b.date as appointment_date, b.time_slot, b.service_type
            FROM medical_notes mn
            JOIN booking b ON mn.booking_id = b.id
            WHERE mn.patient_id = ? OR (mn.patient_id IS NULL AND b.user_id = ?)
            ORDER BY b.date DESC, b.time_slot ASC
        `;

            db.query(sql, [patientId, userId], (historyErr, results) => {
                if (historyErr) {
                    console.error("Database error:", historyErr);
                    return res.status(500).json({ error: "Database error" });
                }

                // Parse vital_signs JSON for each record
                const medicalHistory = results.map(record => {
                    if (record.vital_signs) {
                        try {
                            record.vital_signs = JSON.parse(record.vital_signs);
                        } catch (parseErr) {
                            console.error("Error parsing vital signs:", parseErr);
                            record.vital_signs = null;
                        }
                    }
                    return record;
                });

                res.json(medicalHistory);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getMyMedicalHistory:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'Patient profile not found' : 'Database error' });
        });
};

// Get medical records for admin - simplified approach copying patient-side logic
const getAdminMedicalRecordsByAppointment = (req, res) => {
    const { booking_id } = req.params;

    const sql = `
        SELECT mn.*, b.date as appointment_date, b.time_slot, b.service_type,
               b.patient_name, b.contact_number, b.user_id,
               TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) as patient_profile_name, p.email, p.phone, p.age, p.gender, p.address
        FROM medical_notes mn
        JOIN booking b ON mn.booking_id = b.id
        LEFT JOIN patients p ON mn.patient_id = p.id
        WHERE mn.booking_id = ?
    `;

    db.query(sql, [booking_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Medical notes not found" });
        }

        // Parse vital_signs JSON if it exists
        const medicalNote = results[0];
        if (medicalNote.vital_signs) {
            try {
                medicalNote.vital_signs = JSON.parse(medicalNote.vital_signs);
            } catch (parseErr) {
                console.error("Error parsing vital signs:", parseErr);
                medicalNote.vital_signs = null;
            }
        }

        // Create patient info object
        const patient_info = {
            name: medicalNote.patient_profile_name || medicalNote.patient_name,
            email: medicalNote.email || 'N/A',
            phone: medicalNote.phone || medicalNote.contact_number,
            age: medicalNote.age || 'N/A',
            gender: medicalNote.gender || 'N/A',
            address: medicalNote.address || 'N/A',
            blood_type: medicalNote.blood_type || 'N/A',
            patient_type: medicalNote.user_id ? 'registered' : 'walk_in'
        };

        res.json({
            patient_info: patient_info,
            medical_records: [medicalNote]
        });
    });
};

// Get all medical records for a patient - admin version
const getAdminPatientMedicalHistory = (req, res) => {
    const { patient_id } = req.params;

    const sql = `
        SELECT mn.*, 
               mn.id as appointment_id,
               COALESCE(b.date, DATE(mn.created_at)) as visit_date, 
               b.time_slot, 
               COALESCE(b.service_type, 'Manual Entry') as service_type,
               TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) as patient_profile_name, 
               p.email, 
               p.phone, 
               p.age, 
               p.gender, 
               p.address
        FROM medical_notes mn
        LEFT JOIN booking b ON mn.booking_id = b.id
        LEFT JOIN patients p ON mn.patient_id = p.id
        WHERE mn.patient_id = ?
        ORDER BY visit_date DESC, b.time_slot DESC
    `;

    db.query(sql, [patient_id], (err, results) => {
        if (err) {
            console.error("Database error getAdminPatientMedicalHistory:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (results.length === 0) {
            // Return empty array instead of 404 to allow graceful handling
            return res.json({ medical_records: [] });
        }

        // Parse vital_signs JSON for each record
        const medicalHistory = results.map(record => {
            if (record.vital_signs) {
                try {
                    record.vital_signs = JSON.parse(record.vital_signs);
                } catch (parseErr) {
                    console.error("Error parsing vital signs:", parseErr);
                    record.vital_signs = null;
                }
            }
            return record;
        });

        res.json({ medical_records: medicalHistory });
    });
};

// Get patient's lab results by user_id (for patient access)
const getMyLabResults = (req, res) => {
    const userId = req.user.id;
    getOrCreatePatientIdByUserId(userId)
        .then((patientId) => {
            const sql = `
            SELECT 
              lr.*, 
              lr.test_type AS test_name,
              lr.result_value AS result,
              b.date AS appointment_date, 
              b.time_slot, 
              b.service_type
            FROM lab_results lr
            LEFT JOIN booking b ON lr.booking_id = b.id
            WHERE lr.patient_id = ?
            ORDER BY lr.test_date DESC
        `;

            db.query(sql, [patientId], (historyErr, results) => {
                if (historyErr) {
                    console.error("Database error:", historyErr);
                    return res.status(500).json({ error: "Database error" });
                }

                res.json(results);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getMyLabResults:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'Patient profile not found' : 'Database error' });
        });
};

// Get patient's procedures by user_id (for patient access)
const getMyProcedures = (req, res) => {
    const userId = req.user.id;
    getOrCreatePatientIdByUserId(userId)
        .then((patientId) => {
            const sql = `
            SELECT 
              p.*, 
              p.procedure_date AS appointment_date, 
              p.procedure_time AS time_slot,
              COALESCE(p.procedure_category, 'Procedure') AS service_type
            FROM procedures p
            WHERE p.patient_id = ?
            ORDER BY p.procedure_date DESC
        `;

            db.query(sql, [patientId], (historyErr, results) => {
                if (historyErr) {
                    console.error("Database error:", historyErr);
                    return res.status(500).json({ error: "Database error" });
                }

                res.json(results);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getMyProcedures:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'Patient profile not found' : 'Database error' });
        });
};

// Get patient's screenings by user_id (for patient access)
const getMyScreenings = (req, res) => {
    const userId = req.user.id;
    getOrCreatePatientIdByUserId(userId)
        .then((patientId) => {
            const sql = `
            SELECT 
              s.*, 
              s.results AS result,
              s.screening_date AS appointment_date,
              '00:00' AS time_slot,
              'Screening' AS service_type
            FROM screenings s
            WHERE s.patient_id = ?
            ORDER BY s.screening_date DESC
        `;

            db.query(sql, [patientId], (historyErr, results) => {
                if (historyErr) {
                    console.error("Database error:", historyErr);
                    return res.status(500).json({ error: "Database error" });
                }

                res.json(results);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getMyScreenings:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'Patient profile not found' : 'Database error' });
        });
};

// Get patient's immunizations by user_id (for patient access)
const getMyImmunizations = (req, res) => {
    const userId = req.user.id;
    getOrCreatePatientIdByUserId(userId)
        .then((patientId) => {
            const sql = `
            SELECT 
              i.id,
              i.patient_id,
              i.vaccine_type AS vaccine_name,
              i.date_given AS appointment_date,
              i.dose_number,
              i.batch_number AS lot_number,
              i.injection_site AS site_given,
              i.healthcare_provider,
              i.manufacturer,
              i.next_due_date AS next_dose_due,
              i.adverse_reactions AS reactions,
              i.notes,
              '00:00' AS time_slot,
              'Immunization' AS service_type
            FROM immunizations i
            WHERE i.patient_id = ? AND i.patient_type = 'registered'
            ORDER BY i.date_given DESC
        `;

            db.query(sql, [patientId], (historyErr, results) => {
                if (historyErr) {
                    console.error("Database error:", historyErr);
                    return res.status(500).json({ error: "Database error" });
                }

                res.json(results);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getMyImmunizations:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'Patient profile not found' : 'Database error' });
        });
};

module.exports = {
    addMedicalNotes,
    getMedicalNotesByAppointment,
    getPatientMedicalHistory,
    getMyMedicalHistory,
    getMyLabResults,
    getMyProcedures,
    getMyScreenings,
    getMyImmunizations,
    getAdminMedicalRecordsByAppointment,
    getAdminPatientMedicalHistory,
    addOrUpdateVitalsByStaff,
    getWalkInRecords
};
// 30-minute slot sequence used across the app (kept consistent with other controllers)
const SLOT_SEQUENCE = [
    '8:00-8:30AM', '8:30-9:00AM', '9:00-9:30AM', '9:30-10:00AM',
    '10:00-10:30AM', '10:30-11:00AM', '11:00-11:30AM', '11:30-12:00PM',
    '1:00-1:30PM', '1:30-2:00PM', '2:00-2:30PM', '2:30-3:00PM',
    '3:00-3:30PM', '3:30-4:00PM', '4:00-4:30PM', '4:30-5:00PM'
];

// Ensure all standard slots exist as 'available' for a specific date.
// This preserves existing statuses via a no-op update and only inserts missing rows.
function ensureDayAvailable(date, callback = () => { }) {
    if (!date) return callback();
    const upsertCalendarSql = `
    INSERT INTO appointments (date, time, title, status)
    VALUES (?, '00:00:00', 'Available', 'available')
    ON DUPLICATE KEY UPDATE title = title, status = status
  `;
    db.query(upsertCalendarSql, [date], () => callback());
}

function isValidYYYYMMDD(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function resolvePregnancyIdForDateLocal(patientId, dateString, done) {
    const d = dateString ? new Date(dateString) : null;
    if (!patientId || !d) return done(null, null);
    const babiesSql = `SELECT birth_date FROM babies WHERE mother_patient_id = ? AND birth_date IS NOT NULL ORDER BY birth_date ASC`;
    db.query(babiesSql, [patientId], (bErr, bRows) => {
        if (bErr) return done(bErr);
        const births = (bRows || []).map(r => r.birth_date).filter(Boolean).map(x => new Date(x)).sort((a, b) => a - b);
        if (births.length > 0) {
            let count = 0;
            for (const bd of births) { if (d > bd) count++; else break; }
            return done(null, count + 1);
        }
        const admSql = `SELECT COALESCE(delivered_at, admitted_at) AS pivot FROM admissions WHERE patient_id = ? AND (delivered_at IS NOT NULL OR admitted_at IS NOT NULL) ORDER BY COALESCE(delivered_at, admitted_at) ASC`;
        db.query(admSql, [patientId], (aErr, aRows) => {
            if (aErr) return done(aErr);
            const pivots = (aRows || []).map(r => r.pivot).filter(Boolean).map(x => new Date(x)).sort((a, b) => a - b);
            if (pivots.length > 0) {
                let count = 0;
                for (const pv of pivots) { if (d > pv) count++; else break; }
                return done(null, count + 1);
            }
            const prSql = `SELECT MAX(pregnancy_id) AS max_pid, MAX(COALESCE(scheduled_date, visit_date)) AS last_dt FROM prenatal_schedule WHERE patient_id = ?`;
            db.query(prSql, [patientId], (pErr, pRows) => {
                if (pErr) return done(pErr);
                const maxPid = pRows && pRows[0] && pRows[0].max_pid ? Number(pRows[0].max_pid) : null;
                const lastDt = pRows && pRows[0] && pRows[0].last_dt ? new Date(pRows[0].last_dt) : null;
                if (!lastDt || Math.abs(d - lastDt) > 1000 * 60 * 60 * 24 * 180) {
                    return done(null, (maxPid || 0) + 1);
                }
                return done(null, maxPid || 1);
            });
        });
    });
}

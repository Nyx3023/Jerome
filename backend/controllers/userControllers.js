const db = require("../config/db");
const { getOrCreatePatientIdByUserId } = require('../utils/patientAutoLink');
const { broadcast } = require('../utils/sse');

// Slot sequence for queue-based system (16 slots per day)
const SLOT_SEQUENCE = [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
];

function getConsecutiveSlots(startSlot, count) {
    const startIndex = SLOT_SEQUENCE.indexOf(startSlot);
    if (startIndex === -1) return null;
    const endIndex = startIndex + count;
    if (endIndex > SLOT_SEQUENCE.length) return null;
    return SLOT_SEQUENCE.slice(startIndex, endIndex);
}

function getRequiredSlotsForDuration(durationMinutes) {
    const base = 30; // current system uses 30-minute slots
    if (!durationMinutes || durationMinutes <= 0) return 1;
    return Math.max(1, Math.ceil(durationMinutes / base));
}

// Get available staff members for booking
const getAvailableStaff = (req, res) => {
    const sql = `
        SELECT s.id, s.name, s.position, s.email, s.phone
        FROM staff s
        INNER JOIN users u ON s.email = u.email
        WHERE u.role = 'staff' AND u.email_verified = 1
        ORDER BY s.name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// Get available counselors (users with role staff or doctor)
const getAvailableCounselors = (req, res) => {
    const sql = `
        SELECT u.id AS user_id, s.name, 'staff' AS role
        FROM staff s
        INNER JOIN users u ON s.email = u.email
        WHERE u.role = 'staff' AND u.email_verified = 1
        UNION
        SELECT u.id AS user_id, d.name, 'doctor' AS role
        FROM doctors d
        INNER JOIN users u ON d.email = u.email
        WHERE u.role = 'doctor' AND u.email_verified = 1
        ORDER BY name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// Get appointments for a user
const getAppointments = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT b.*, p.name as patient_name, p.phone as contact_number 
        FROM booking b
        JOIN patients p ON b.user_id = p.user_id
        WHERE b.user_id = ?
        ORDER BY b.date DESC, b.time_slot ASC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

const getAvailableSlots = (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }
    const bookedSql = `SELECT time_slot FROM booking WHERE date = ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
    const blockedSql = `SELECT time_slot FROM slots WHERE date = ? AND status = 'not_available'`;
    db.query(bookedSql, [date], (bErr, bRows) => {
        if (bErr) {
            return res.status(500).json({ error: "Database error" });
        }
        db.query(blockedSql, [date], (blErr, blRows) => {
            if (blErr) {
                return res.status(500).json({ error: "Database error" });
            }
            const bookedSet = new Set((bRows || []).map(r => r.time_slot));
            const blockedSet = new Set((blRows || []).map(r => r.time_slot));
            const results = [];
            for (const s of SLOT_SEQUENCE) {
                if (!bookedSet.has(s) && !blockedSet.has(s)) {
                    results.push({ id: null, time_slot: s, status: 'available' });
                }
            }
            res.json(results);
        });
    });
};

// Get Holiday slots for a specific date
const getHolidaySlots = (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }

    const query = `
        SELECT id, date, title 
        FROM appointments 
        WHERE date = ? 
        AND status = 'holiday'
    `;

    db.query(query, [date], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// Get booked slots for a specific date
const getBookedSlots = (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }

    // Check both slots table (manually blocked) AND booking table (actual bookings including walk-ins)
    const query = `
        SELECT time_slot, 'booked' as status
        FROM slots
        WHERE DATE(date) = ?
        AND status IN ('booked','not_available','pending')
        
        UNION
        
        SELECT time_slot, 'booked' as status
        FROM booking
        WHERE DATE(date) = ?
        AND (request_status IS NULL OR request_status != 'declined')
        AND (appointment_status IS NULL OR appointment_status != 'cancelled')
    `;

    db.query(query, [date, date], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

// Get patient profile (auto-create minimal profile if missing)
const getPatientProfile = (req, res) => {
    const userId = req.user.id;

    getOrCreatePatientIdByUserId(userId)
        .then(() => {
            const query = `
            SELECT 
                p.user_id,
                p.first_name,
                p.middle_name,
                p.last_name,
                p.email,
                p.phone,
                p.age,
                p.gender,
                p.address,
                p.religion,
                p.occupation,
                p.place_of_birth,
                p.date_of_birth,
                p.marital_status,
                p.nationality,
                p.ethnicity,
                p.preferred_language,
                p.profile_picture,
                u.email as account_email
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
        `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: "Profile not found" });
                }

                res.json(results[0]);
            });
        })
        .catch((err) => {
            console.error('Auto-link error getPatientProfile:', err);
            const status = err.statusCode || 500;
            res.status(status).json({ error: status === 404 ? 'User not found' : 'Database error' });
        });
};

// Create or update patient profile
const updatePatientProfile = (req, res) => {
    const { first_name, middle_name, last_name, email, phone, age, gender, address, religion, occupation, place_of_birth, date_of_birth, marital_status, nationality, ethnicity, preferred_language, expected_delivery_date, last_menstrual_period } = req.body;
    const userId = req.user.id;

    const checkQuery = "SELECT * FROM patients WHERE user_id = ?";
    db.query(checkQuery, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            // Create new profile
            const insertQuery = `
                INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, age, gender, address, religion, occupation, place_of_birth, date_of_birth, marital_status, nationality, ethnicity, preferred_language, expected_delivery_date, last_menstrual_period)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [userId, first_name, middle_name || null, last_name, email, phone, age, gender, address, religion || null, occupation || null, place_of_birth || null, date_of_birth || null, marital_status || null, nationality || null, ethnicity || null, preferred_language || null, expected_delivery_date || null, last_menstrual_period || null], (err) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.json({ message: "Profile created successfully" });
            });
        } else {
            // Update existing profile
            const updateQuery = `
                UPDATE patients 
                SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, age = ?, gender = ?, address = ?, religion = ?, occupation = ?, place_of_birth = ?, date_of_birth = ?, marital_status = ?, nationality = ?, ethnicity = ?, preferred_language = ?, expected_delivery_date = ?, last_menstrual_period = ?
                WHERE user_id = ?
            `;
            db.query(updateQuery, [first_name, middle_name || null, last_name, email, phone, age, gender, address, religion || null, occupation || null, place_of_birth || null, date_of_birth || null, marital_status || null, nationality || null, ethnicity || null, preferred_language || null, expected_delivery_date || null, last_menstrual_period || null, userId], (err) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.json({ message: "Profile updated successfully" });
            });
        }
    });
};

// Get patient appointments
const getPatientAppointments = (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // First check if patient profile exists
    const checkProfileQuery = `
        SELECT * FROM patients 
        WHERE user_id = ? 
        AND user_id IS NOT NULL
    `;

    db.query(checkProfileQuery, [userId], (err, profileResults) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // If no profile exists, return empty appointments
        if (profileResults.length === 0) {
            return res.json([]);
        }

        // If profile exists, get appointments with strict user checking
        const sql = `
            SELECT 
                b.id,
                b.date,
                b.time_slot,
                b.service_type,
                b.request_status,
                b.appointment_status,
                b.user_id,
                b.cancel_reason,
                b.cancel_note,
                b.cancelled_by,
                b.cancelled_at,
                b.decline_reason,
                b.decline_note,
                b.declined_by,
                b.declined_at,
                b.follow_up_of_booking_id,
                b.follow_up_due_on,
                TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) as patient_name,
                p.phone as contact_number
            FROM booking b
            INNER JOIN patients p ON b.user_id = p.user_id
            WHERE b.user_id = ?
            AND b.user_id IS NOT NULL
            AND p.user_id = ?
            ORDER BY b.date DESC, b.time_slot ASC
        `;

        db.query(sql, [userId, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            // Additional verification of results
            const verifiedResults = results.filter(appointment =>
                appointment.user_id === userId
            );

            res.json(verifiedResults);
        });
    });
};

// Book an appointment
const bookAppointment = (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    const { service_type, date, time_slot, follow_up_of_booking_id, follow_up_due_on, is_ob_booking, ob_provider_type } = req.body;
    if (!service_type || !date) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }
    const obBookingFlag = is_ob_booking ? 1 : 0;
    const obProviderType = ob_provider_type || null;

    const getPatientQuery = "SELECT * FROM patients WHERE user_id = ?";
    db.query(getPatientQuery, [userId], (err, patients) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (!patients.length) {
            return res.status(400).json({ error: "Please complete your profile first" });
        }
        const patient = patients[0];
        if (!patient.first_name || !patient.last_name || !patient.phone || patient.phone === '00000000000') {
            return res.status(400).json({ error: "Please complete your profile with valid name and phone number before booking" });
        }

        const countSql = "SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND request_status IN ('pending','confirmed') AND appointment_status NOT IN ('cancelled')";
        db.query(countSql, [date], (countErr, countRows) => {
            if (countErr) {
                return res.status(500).json({ error: "Database error" });
            }
            const currentCount = (countRows && countRows[0] && Number(countRows[0].cnt)) ? Number(countRows[0].cnt) : 0;

            const capSql = "SELECT slots FROM appointments WHERE date = ? AND status = 'available' LIMIT 1";
            db.query(capSql, [date], (capErr, capRows) => {
                if (capErr) {
                    return res.status(500).json({ error: "Database error" });
                }
                const configuredCap = (capRows && capRows[0] && Number(capRows[0].slots)) ? Number(capRows[0].slots) : null;
                const defaultCap = Number(process.env.ONLINE_DAY_CAPACITY_DEFAULT) || 10;
                const capLimit = configuredCap && configuredCap > 0 ? configuredCap : defaultCap;
                if (currentCount >= capLimit) {
                    const suggestSql = "SELECT date FROM appointments WHERE status = 'available' AND date > ? ORDER BY date ASC LIMIT 1";
                    return db.query(suggestSql, [date], (sErr, sRows) => {
                        const nextDate = sRows && sRows[0] && sRows[0].date;
                        return res.status(400).json({ error: "Day is fully booked", next_available_date: nextDate || null });
                    });
                }

                const doubleCheckSql = "SELECT COUNT(*) AS cnt FROM booking WHERE user_id = ? AND date >= CURDATE() AND request_status IN ('pending','confirmed') AND appointment_status NOT IN ('cancelled','completed')";
                db.query(doubleCheckSql, [userId], (dcErr, dcRows) => {
                    if (dcErr) {
                        return res.status(500).json({ error: "Database error" });
                    }
                    const upcomingCount = (dcRows && dcRows[0] && Number(dcRows[0].cnt)) ? Number(dcRows[0].cnt) : 0;
                    if (upcomingCount > 0) {
                        return res.status(400).json({ error: "You already have an upcoming appointment. Please complete, cancel, or reschedule it before booking another." });
                    }

                    // Find the next available slot by checking existing bookings
                    const findSlotSql = `
            SELECT time_slot FROM booking 
            WHERE DATE(date) = ?
            AND (request_status IS NULL OR request_status != 'declined')
            AND (appointment_status IS NULL OR appointment_status != 'cancelled')
            UNION
            SELECT time_slot FROM slots 
            WHERE DATE(date) = ?
            AND status IN ('booked', 'not_available', 'pending')
          `;

                    db.query(findSlotSql, [date, date], (slotErr, takenSlots) => {
                        if (slotErr) {
                            return res.status(500).json({ error: "Database error checking slots" });
                        }

                        // Build set of taken slot names
                        const takenSet = new Set((takenSlots || []).map(s => s.time_slot));

                        // Find first available slot
                        let assignedSlot = time_slot; // Use provided slot if given
                        if (!assignedSlot) {
                            // Auto-assign next available slot
                            for (let i = 1; i <= 16; i++) {
                                const slotName = `Slot ${i}`;
                                if (!takenSet.has(slotName)) {
                                    assignedSlot = slotName;
                                    break;
                                }
                            }

                            if (!assignedSlot) {
                                return res.status(400).json({ error: "All slots are fully booked for this date" });
                            }
                        } else {
                            // Verify the requested slot is available
                            if (takenSet.has(assignedSlot)) {
                                return res.status(400).json({ error: `${assignedSlot} is already booked. Please select another slot.` });
                            }
                        }

                        const fullName = [patient.first_name || '', patient.middle_name || '', patient.last_name || ''].filter(Boolean).join(' ').trim();
                        const insertSql = "INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, is_ob_booking, ob_provider_type) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)";
                        const values = [userId, fullName, patient.phone, service_type, date, assignedSlot, obBookingFlag, obProviderType];
                        db.query(insertSql, values, (iErr, iRes) => {
                            if (iErr) {
                                return res.status(500).json({ error: "Database error" });
                            }
                            if (follow_up_of_booking_id) {
                                const upd = "UPDATE booking SET follow_up_of_booking_id = ?, follow_up_due_on = ? WHERE id = ?";
                                return db.query(upd, [follow_up_of_booking_id, follow_up_due_on || null, iRes.insertId], () => {
                                    res.json({ message: "Appointment booked successfully", appointmentId: iRes.insertId, assigned_slot: assignedSlot });
                                });
                            }
                            res.json({ message: "Appointment booked successfully", appointmentId: iRes.insertId, assigned_slot: assignedSlot });
                        });
                    });
                });
            });
        });
    });
}

// Reschedule an existing appointment (patient)
const rescheduleAppointment = (req, res) => {
    const userId = req.user.id;
    const { booking_id, new_date, new_time_slot } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    if (!booking_id || !new_date || !new_time_slot) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify booking belongs to the user
    const getBookingSql = "SELECT * FROM booking WHERE id = ? AND user_id = ?";
    db.query(getBookingSql, [booking_id, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const original = results[0];

        // Calendar availability: block rescheduling to holidays; allow if date is marked 'available' or no calendar entry
        const dayStatusSql = "SELECT status FROM appointments WHERE DATE(date) = ?";
        db.query(dayStatusSql, [new_date], (dayErr, dayRows) => {
            if (dayErr) {
                console.error("Database error:", dayErr);
                return res.status(500).json({ error: "Database error" });
            }
            const statuses = new Set((dayRows || []).map(r => String(r.status || '').toLowerCase()));
            if (statuses.has('holiday')) {
                return res.status(400).json({ error: "Selected date is a holiday. Please choose an available date." });
            }
            // If there are entries and none is 'available', reject
            if (dayRows.length > 0 && !statuses.has('available')) {
                return res.status(400).json({ error: "Selected date is not marked available." });
            }

            // Check slot conflict for the new schedule
            const conflictSql = `
                SELECT * FROM booking
                WHERE date = ? AND time_slot = ?
                  AND request_status != 'declined'
                  AND appointment_status != 'cancelled'
                  AND id != ?
            `;
            db.query(conflictSql, [new_date, new_time_slot, booking_id], (confErr, confRes) => {
                if (confErr) {
                    console.error("Database error:", confErr);
                    return res.status(500).json({ error: "Database error" });
                }
                if (confRes.length > 0) {
                    return res.status(400).json({ error: "This time slot is already booked or unavailable." });
                }

                // Transaction: update booking and free old reserved slots
                db.beginTransaction((txErr) => {
                    if (txErr) {
                        console.error("Transaction error:", txErr);
                        return res.status(500).json({ error: "Database error" });
                    }

                    const updateBookingSql = `
                        UPDATE booking
                        SET date = ?, time_slot = ?, request_status = 'pending'
                        WHERE id = ? AND user_id = ?
                    `;
                    db.query(updateBookingSql, [new_date, new_time_slot, booking_id, userId], (updErr, updRes) => {
                        if (updErr) {
                            return db.rollback(() => {
                                console.error("Error updating booking:", updErr);
                                res.status(500).json({ error: "Error updating booking" });
                            });
                        }

                        const freeOldSlotSql = `
                            DELETE FROM slots WHERE booking_id = ?
                        `;
                        db.query(freeOldSlotSql, [booking_id], (freeErr) => {
                            if (freeErr) {
                                return db.rollback(() => {
                                    console.error("Error freeing old slot:", freeErr);
                                    res.status(500).json({ error: "Error updating old slot" });
                                });
                            }

                            // Determine required consecutive slots for the existing service
                            const svcSql = `SELECT duration FROM services WHERE name = (SELECT service_type FROM booking WHERE id = ?) LIMIT 1`;
                            db.query(svcSql, [booking_id], (svcErr, svcRows) => {
                                if (svcErr) {
                                    return db.rollback(() => {
                                        console.error("Error loading service for reschedule:", svcErr);
                                        res.status(500).json({ error: "Database error" });
                                    });
                                }
                                const duration = svcRows?.[0]?.duration || 30;
                                const requiredSlots = getRequiredSlotsForDuration(Number(duration));
                                const neededSlots = getConsecutiveSlots(new_time_slot, requiredSlots);
                                if (!neededSlots) {
                                    return db.rollback(() => {
                                        res.status(400).json({ error: "Not enough consecutive time slots for reschedule" });
                                    });
                                }
                                const placeholders = neededSlots.map(() => '?').join(',');
                                const conflictSql2 = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND id != ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
                                db.query(conflictSql2, [new_date, ...neededSlots, booking_id], (c2Err, c2Res) => {
                                    if (c2Err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ error: "Database error" });
                                        });
                                    }
                                    const blockedSql = `SELECT COUNT(*) AS cnt FROM slots WHERE date = ? AND time_slot IN (${placeholders}) AND status = 'not_available'`;
                                    db.query(blockedSql, [new_date, ...neededSlots], (blErr, blRes) => {
                                        if (blErr) {
                                            return db.rollback(() => {
                                                res.status(500).json({ error: "Database error" });
                                            });
                                        }
                                        if ((c2Res?.[0]?.cnt || 0) > 0 || (blRes?.[0]?.cnt || 0) > 0) {
                                            return db.rollback(() => {
                                                res.status(400).json({ error: "Selected time is not available" });
                                            });
                                        }
                                        return db.commit((commitErr) => {
                                            if (commitErr) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ error: "Error finalizing reschedule" });
                                                });
                                            }
                                            res.json({ message: "Reschedule request submitted. Awaiting staff approval." });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

// Get active services
const getServices = (req, res) => {
    console.log('Fetching active services...'); // Debug log
    const sql = "SELECT * FROM services WHERE status = 'active' ORDER BY name";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        console.log('Found services:', results); // Debug log
        res.json(results);
    });
};

// Get schedules (holidays, available dates, not available dates, and ob available dates)
const getSchedules = (req, res) => {
    db.query("SELECT id, title, date AS start, status FROM appointments WHERE status IN ('available','holiday','notavailable','not available','ob available')", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
};

const getDaySlotSummary = (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }
    const totalSlots = SLOT_SEQUENCE.length;
    // Count booked slots from booking table (use DATE() for timezone-aware comparison)
    const bookedSql = `
        SELECT COUNT(*) AS cnt FROM booking 
        WHERE DATE(date) = ? 
        AND (request_status IS NULL OR request_status != 'declined') 
        AND (appointment_status IS NULL OR appointment_status != 'cancelled')
    `;
    // Count manually blocked slots from slots table
    const blockedSql = "SELECT COUNT(*) AS cnt FROM slots WHERE DATE(date) = ? AND status = 'not_available'";
    db.query(bookedSql, [date], (bErr, bRows) => {
        if (bErr) {
            return res.status(500).json({ error: "Database error" });
        }
        const booked = Number(bRows?.[0]?.cnt || 0);
        db.query(blockedSql, [date], (blErr, blRows) => {
            if (blErr) {
                return res.status(500).json({ error: "Database error" });
            }
            const blocked = Number(blRows?.[0]?.cnt || 0);
            const remaining = Math.max(totalSlots - booked - blocked, 0);
            res.json({ date, total_slots: totalSlots, booked_count: booked, blocked_count: blocked, remaining_slots: remaining });
        });
    });
};

// Cancel an existing appointment (patient)
const cancelAppointment = (req, res) => {
    const userId = req.user.id;
    const { booking_id, cancel_reason, cancel_note } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    if (!booking_id) {
        return res.status(400).json({ error: "Missing booking_id" });
    }

    const getBookingSql = "SELECT * FROM booking WHERE id = ? AND user_id = ?";
    db.query(getBookingSql, [booking_id, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const booking = results[0];
        if (["completed", "cancelled"].includes((booking.appointment_status || '').toLowerCase())) {
            return res.status(400).json({ error: "Appointment already completed or cancelled" });
        }

        db.beginTransaction((txErr) => {
            if (txErr) {
                console.error("Transaction error:", txErr);
                return res.status(500).json({ error: "Database error" });
            }

            const updateBooking = `
                UPDATE booking 
                SET request_status = 'cancelled',
                    appointment_status = 'cancelled',
                    cancel_reason = ?,
                    cancel_note = ?,
                    cancelled_by = 'patient',
                    cancelled_at = NOW(),
                    updated_at = NOW()
                WHERE id = ? AND user_id = ?
            `;
            db.query(updateBooking, [cancel_reason || null, cancel_note || null, booking_id, userId], (updErr) => {
                if (updErr) {
                    return db.rollback(() => {
                        console.error("Error cancelling booking:", updErr);
                        res.status(500).json({ error: "Error cancelling booking" });
                    });
                }

                const freeSlot = `
                    DELETE FROM slots WHERE booking_id = ?
                `;
                db.query(freeSlot, [booking_id], (slotErr) => {
                    if (slotErr) {
                        return db.rollback(() => {
                            console.error("Error freeing slot:", slotErr);
                            res.status(500).json({ error: "Error updating slot" });
                        });
                    }

                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error("Commit error:", commitErr);
                                res.status(500).json({ error: "Error finalizing cancellation" });
                            });
                        }
                        res.json({ message: "Appointment cancelled" });
                    });
                });
            });
        });
    });
};

// (waitlist removed)

// Submit feedback for a completed appointment
const submitFeedback = (req, res) => {
    const userId = req.user.id;
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || !rating) {
        return res.status(400).json({ error: 'booking_id and rating are required' });
    }
    const getBookingSql = "SELECT * FROM booking WHERE id = ? AND user_id = ?";
    db.query(getBookingSql, [booking_id, userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
        const status = (rows[0].appointment_status || '').toLowerCase();
        if (status !== 'completed') return res.status(400).json({ error: 'Feedback allowed only after completion' });

        const sql = `
            INSERT INTO appointment_feedback (booking_id, user_id, rating, comment)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP
        `;
        db.query(sql, [booking_id, userId, rating, comment || null], (iErr) => {
            if (iErr) {
                console.error('Error saving feedback:', iErr);
                return res.status(500).json({ error: 'Database error' });
            }
            db.query('UPDATE booking SET feedback_requested = 1 WHERE id = ?', [booking_id], () => {
                res.json({ message: 'Feedback submitted' });
            });
        });
    });
};

// Upload profile picture
const uploadProfilePicture = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id;
    const profilePicturePath = req.file.filename; // This will be the filename stored

    // Update the patient's profile_picture field
    const updateQuery = "UPDATE patients SET profile_picture = ? WHERE user_id = ?";
    db.query(updateQuery, [profilePicturePath, userId], (err) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to update profile picture" });
        }
        res.json({
            message: "Profile picture updated successfully",
            profile_picture: profilePicturePath
        });
    });
};

module.exports = {
    getAvailableCounselors,
    getAvailableStaff,
    getAppointments,
    getAvailableSlots,
    getHolidaySlots,
    getBookedSlots,
    getPatientProfile,
    updatePatientProfile,
    getPatientAppointments,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    submitFeedback,
    getServices,
    getSchedules,
    getDaySlotSummary,
    uploadProfilePicture,
    reportOverdueAppointments
};

// Report overdue appointments (client-side detection) and notify admin via SSE
function reportOverdueAppointments(req, res) {
    const userId = req.user && req.user.id;
    const { booking_ids } = req.body || {};
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
        return res.status(400).json({ error: "booking_ids array is required" });
    }

    const placeholders = booking_ids.map(() => '?').join(',');
    const sql = `
    SELECT 
      b.id,
      b.date,
      b.time_slot,
      b.service_type,
      b.request_status,
      b.appointment_status,
      b.checked_in_at,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.phone
    FROM booking b
    INNER JOIN patients p ON b.user_id = p.user_id
    WHERE b.id IN (${placeholders}) AND b.user_id = ?
  `;
    db.query(sql, [...booking_ids, userId], (err, rows) => {
        if (err) {
            console.error('Database error reportOverdueAppointments:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(d));
        const todayStr = fmt(new Date());
        const overdue = (rows || []).filter(r => {
            const aptStr = fmt(r.date);
            const status = String(r.appointment_status || '').toLowerCase();
            const isPastDay = aptStr < todayStr;
            const inactive = ['completed', 'cancelled'].includes(status);
            return isPastDay && !inactive && !r.checked_in_at;
        });
        for (const o of overdue) {
            const patient_name = [o.first_name || '', o.middle_name || '', o.last_name || ''].filter(Boolean).join(' ').trim();
            broadcast('appointment_overdue', {
                booking_id: o.id,
                patient_name,
                phone: o.phone || null,
                date: o.date,
                time_slot: o.time_slot,
                service_type: o.service_type
            });
        }
        return res.json({ notified: overdue.length });
    });
}

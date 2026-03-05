const db = require("../config/db");

// Create a new admission (staff/admin)
const createAdmission = (req, res) => {
  const {
    booking_id,
    existing_user_id, // registered patient user_id, optional
    patient_name, // for walk-in style
    contact_number,
    admission_reason,
    room,
    status,
    delivery_type,
    outcome,
    baby_weight_kg,
    apgar1,
    apgar5,
    complications,
    disposition,
    patient_type, // This field is sent by frontend but not stored in DB
    pregnancy_cycle,
    notes
  } = req.body;

  if (!admission_reason) {
    return res.status(400).json({ error: "admission_reason is required" });
  }

  const reasonStr = String(admission_reason).toLowerCase();
  const allowedTokens = ['labor','delivery','birth'];
  if (!allowedTokens.some(t => reasonStr.includes(t))) {
    return res.status(400).json({ error: "Admission restricted to birth-related cases only" });
  }

  // Resolve user_id (NULL for non-registered/walk-in)
  const userId = Number(existing_user_id) > 0 ? Number(existing_user_id) : null;

  // Function to insert admission after booking validation
  const insertAdmission = (validatedBookingId) => {
    const sql = `
      INSERT INTO admissions (
        booking_id,
        user_id,
        patient_name,
        contact_number,
        admission_reason,
        pregnancy_cycle,
        room,
        status,
        delivery_type,
        outcome,
        baby_weight_kg,
        apgar1,
        apgar5,
        complications,
        disposition,
        notes,
        admitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      validatedBookingId,
      userId,
      (patient_name || null),
      (contact_number || null),
      admission_reason,
      pregnancy_cycle || null,
      room || null,
      status || 'admitted',
      delivery_type || null,
      outcome || null,
      baby_weight_kg ? parseFloat(baby_weight_kg) : null,
      apgar1 ? parseInt(apgar1) : null,
      apgar5 ? parseInt(apgar5) : null,
      complications || null,
      disposition || null,
      notes || null,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column 'notes'/.test(String(err.message))) {
          const fallbackSql = `
            INSERT INTO admissions (
              booking_id,
              user_id,
              patient_name,
              contact_number,
              admission_reason,
              pregnancy_cycle,
              room,
              status,
              delivery_type,
              outcome,
              baby_weight_kg,
              apgar1,
              apgar5,
              complications,
              disposition,
              admitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;
          const fallbackValues = values.slice(0, values.length - 1);
          return db.query(fallbackSql, fallbackValues, (fErr, fRes) => {
            if (fErr) {
              console.error("Database error (createAdmission - fallback):", fErr);
              return res.status(500).json({ error: "Database error" });
            }
            return res.status(201).json({ message: "Admission created", admission_id: fRes.insertId });
          });
        }
        console.error("Database error (createAdmission):", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ message: "Admission created", admission_id: result.insertId });
    });
  };

  // Validate booking_id if provided
  if (booking_id && booking_id !== '' && booking_id !== 'null' && booking_id !== null) {
    const bookingCheckSql = "SELECT id FROM booking WHERE id = ?";
    db.query(bookingCheckSql, [booking_id], (err, results) => {
      if (err) {
        console.error("Database error (booking validation):", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length === 0) {
        // Booking doesn't exist, set booking_id to null for walk-in admission
        console.log(`Booking ID ${booking_id} not found, creating walk-in admission`);
        insertAdmission(null);
      } else {
        // Booking exists, use the validated booking_id
        insertAdmission(booking_id);
      }
    });
  } else {
    // No booking_id provided or it's null/empty, create walk-in admission
    insertAdmission(null);
  }
};

// List admissions (optionally filter by status)
const listAdmissions = (req, res) => {
  const { status, user_id, patient_name, contact_number } = req.query;
  const clauses = [];
  const params = [];
  if (status) { clauses.push('a.status = ?'); params.push(status); }
  if (user_id) { clauses.push('a.user_id = ?'); params.push(Number(user_id)); }
  if (patient_name) { 
    clauses.push('(a.patient_name LIKE ? OR TRIM(CONCAT_WS(" ", p.first_name, p.middle_name, p.last_name)) LIKE ?)'); 
    params.push(`%${patient_name}%`, `%${patient_name}%`); 
  }
  if (contact_number) { 
    clauses.push('(a.contact_number = ? OR p.phone = ?)'); 
    params.push(contact_number, contact_number); 
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      a.id,
      a.booking_id,
      a.user_id,
      a.patient_name,
      a.contact_number,
      a.admission_reason,
      a.pregnancy_cycle,
      a.room,
      a.status,
      a.admitted_at,
      a.delivered_at,
      a.delivery_type,
      a.outcome,
      a.baby_weight_kg,
      a.apgar1,
      a.apgar5,
      a.complications,
      a.disposition,
      a.notes,
      a.discharge_notes,
      a.discharged_at,
      a.created_at,
      a.updated_at,
      -- Patient information from patients table (for registered patients)
      CASE 
        WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
        ELSE a.patient_name
      END as display_patient_name,
      CASE 
        WHEN a.user_id > 0 THEN p.phone
        ELSE a.contact_number
      END as display_contact_number,
      CASE 
        WHEN a.user_id > 0 THEN p.email
        ELSE NULL
      END as patient_email,
      CASE 
        WHEN a.user_id > 0 THEN p.age
        ELSE NULL
      END as patient_age,
      CASE 
        WHEN a.user_id > 0 THEN p.gender
        ELSE NULL
      END as patient_gender,
      CASE 
        WHEN a.user_id > 0 THEN p.address
        ELSE NULL
      END as patient_address,
      CASE 
        WHEN a.user_id > 0 THEN p.blood_type
        ELSE NULL
      END as patient_blood_type,
      CASE 
        WHEN a.user_id > 0 THEN p.allergies
        ELSE NULL
      END as patient_allergies,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_name
        ELSE NULL
      END as emergency_contact_name,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_phone
        ELSE NULL
      END as emergency_contact_phone,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_relationship
        ELSE NULL
      END as emergency_contact_relationship,
      -- Booking information
      b.service_type, 
      b.date as appointment_date, 
      b.time_slot,
      -- User information
      u.email as user_email,
      -- Patient type indicator
      CASE 
        WHEN a.user_id > 0 THEN 'registered'
        ELSE 'walk-in'
      END as patient_type
    FROM admissions a
    LEFT JOIN booking b ON a.booking_id = b.id
    LEFT JOIN patients p ON a.user_id = p.user_id
    LEFT JOIN users u ON a.user_id = u.id
    ${where}
    ORDER BY a.admitted_at DESC
  `;

  db.query(sql, params, (err, rows) => {
    if (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column 'a\.notes'/.test(String(err.message))) {
        const fallbackSql = `
          SELECT 
            a.id,
            a.booking_id,
            a.user_id,
            a.patient_name,
            a.contact_number,
            a.admission_reason,
            a.pregnancy_cycle,
            a.room,
            a.status,
            a.admitted_at,
            a.delivered_at,
            a.delivery_type,
            a.outcome,
            a.baby_weight_kg,
            a.apgar1,
            a.apgar5,
            a.complications,
            a.disposition,
            a.discharge_notes,
            a.discharged_at,
            a.created_at,
            a.updated_at,
            CASE 
              WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
              ELSE a.patient_name
            END as display_patient_name,
            CASE 
              WHEN a.user_id > 0 THEN p.phone
              ELSE a.contact_number
            END as display_contact_number,
            CASE 
              WHEN a.user_id > 0 THEN p.email
              ELSE NULL
            END as patient_email,
            CASE 
              WHEN a.user_id > 0 THEN p.age
              ELSE NULL
            END as patient_age,
            CASE 
              WHEN a.user_id > 0 THEN p.gender
              ELSE NULL
            END as patient_gender,
            CASE 
              WHEN a.user_id > 0 THEN p.address
              ELSE NULL
            END as patient_address,
            CASE 
              WHEN a.user_id > 0 THEN p.blood_type
              ELSE NULL
            END as patient_blood_type,
            CASE 
              WHEN a.user_id > 0 THEN p.allergies
              ELSE NULL
            END as patient_allergies,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_name
              ELSE NULL
            END as emergency_contact_name,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_phone
              ELSE NULL
            END as emergency_contact_phone,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_relationship
              ELSE NULL
            END as emergency_contact_relationship,
            b.service_type,
            b.date as appointment_date,
            b.time_slot,
            u.email as user_email,
            CASE WHEN a.user_id > 0 THEN 'registered' ELSE 'walk-in' END as patient_type
          FROM admissions a
          LEFT JOIN booking b ON a.booking_id = b.id
          LEFT JOIN patients p ON a.user_id = p.user_id
          LEFT JOIN users u ON a.user_id = u.id
          ${where}
          ORDER BY a.admitted_at DESC
        `;
        return db.query(fallbackSql, params, (fErr, fRows) => {
          if (fErr) {
            console.error("Database error (listAdmissions - fallback):", fErr);
            return res.status(500).json({ error: "Database error" });
          }
          return res.json(fRows);
        });
      }
      console.error("Database error (listAdmissions):", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};

// Get one admission by id
const getAdmissionById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      a.id,
      a.booking_id,
      a.user_id,
      a.patient_name,
      a.contact_number,
      a.admission_reason,
      a.pregnancy_cycle,
      a.room,
      a.status,
      a.admitted_at,
      a.delivered_at,
      a.delivery_type,
      a.outcome,
      a.baby_weight_kg,
      a.apgar1,
      a.apgar5,
      a.complications,
      a.disposition,
      a.notes,
      a.discharge_notes,
      a.discharged_at,
      a.created_at,
      a.updated_at,
      -- Patient information from patients table (for registered patients)
      CASE 
        WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
        ELSE a.patient_name
      END as display_patient_name,
      CASE 
        WHEN a.user_id > 0 THEN p.phone
        ELSE a.contact_number
      END as display_contact_number,
      CASE 
        WHEN a.user_id > 0 THEN p.email
        ELSE NULL
      END as patient_email,
      CASE 
        WHEN a.user_id > 0 THEN p.age
        ELSE NULL
      END as patient_age,
      CASE 
        WHEN a.user_id > 0 THEN p.gender
        ELSE NULL
      END as patient_gender,
      CASE 
        WHEN a.user_id > 0 THEN p.address
        ELSE NULL
      END as patient_address,
      CASE 
        WHEN a.user_id > 0 THEN p.blood_type
        ELSE NULL
      END as patient_blood_type,
      CASE 
        WHEN a.user_id > 0 THEN p.allergies
        ELSE NULL
      END as patient_allergies,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_name
        ELSE NULL
      END as emergency_contact_name,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_phone
        ELSE NULL
      END as emergency_contact_phone,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_relationship
        ELSE NULL
      END as emergency_contact_relationship,
      -- Booking information
      b.service_type, 
      b.date as appointment_date, 
      b.time_slot,
      -- User information
      u.email as user_email,
      -- Patient type indicator
      CASE 
        WHEN a.user_id > 0 THEN 'registered'
        ELSE 'walk-in'
      END as patient_type
    FROM admissions a
    LEFT JOIN booking b ON a.booking_id = b.id
    LEFT JOIN patients p ON a.user_id = p.user_id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column 'a\.notes'/.test(String(err.message))) {
        const fallbackSql = `
          SELECT 
            a.id,
            a.booking_id,
            a.user_id,
            a.patient_name,
            a.contact_number,
            a.admission_reason,
            a.pregnancy_cycle,
            a.room,
            a.status,
            a.admitted_at,
            a.delivered_at,
            a.delivery_type,
            a.outcome,
            a.baby_weight_kg,
            a.apgar1,
            a.apgar5,
            a.complications,
            a.disposition,
            a.discharge_notes,
            a.discharged_at,
            a.created_at,
            a.updated_at,
            CASE 
              WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
              ELSE a.patient_name
            END as display_patient_name,
            CASE 
              WHEN a.user_id > 0 THEN p.phone
              ELSE a.contact_number
            END as display_contact_number,
            CASE 
              WHEN a.user_id > 0 THEN p.email
              ELSE NULL
            END as patient_email,
            CASE 
              WHEN a.user_id > 0 THEN p.age
              ELSE NULL
            END as patient_age,
            CASE 
              WHEN a.user_id > 0 THEN p.gender
              ELSE NULL
            END as patient_gender,
            CASE 
              WHEN a.user_id > 0 THEN p.address
              ELSE NULL
            END as patient_address,
            CASE 
              WHEN a.user_id > 0 THEN p.blood_type
              ELSE NULL
            END as patient_blood_type,
            CASE 
              WHEN a.user_id > 0 THEN p.allergies
              ELSE NULL
            END as patient_allergies,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_name
              ELSE NULL
            END as emergency_contact_name,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_phone
              ELSE NULL
            END as emergency_contact_phone,
            CASE 
              WHEN a.user_id > 0 THEN p.emergency_contact_relationship
              ELSE NULL
            END as emergency_contact_relationship,
            b.service_type, 
            b.date as appointment_date, 
            b.time_slot,
            u.email as user_email,
            CASE 
              WHEN a.user_id > 0 THEN 'registered'
              ELSE 'walk-in'
            END as patient_type
          FROM admissions a
          LEFT JOIN booking b ON a.booking_id = b.id
          LEFT JOIN patients p ON a.user_id = p.user_id
          LEFT JOIN users u ON a.user_id = u.id
          WHERE a.id = ?
        `;
        return db.query(fallbackSql, [id], (fErr, fRows) => {
          if (fErr) {
            console.error("Database error (getAdmissionById - fallback):", fErr);
            return res.status(500).json({ error: "Database error" });
          }
          if (!fRows || fRows.length === 0) return res.status(404).json({ error: "Admission not found" });
          return res.json(fRows[0]);
        });
      }
      console.error("Database error (getAdmissionById):", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Admission not found" });
    res.json(rows[0]);
  });
};

// Update delivery details for an admission
const updateDelivery = (req, res) => {
  const { id } = req.params;
  const {
    delivery_type, // e.g., NSD, CS
    outcome, // live_birth / stillbirth
    baby_weight_kg,
    apgar1,
    apgar5,
    complications,
    delivered_at, // optional datetime; default NOW if not provided
  } = req.body;

  const sql = `
    UPDATE admissions SET
      delivery_type = ?,
      outcome = ?,
      baby_weight_kg = ?,
      apgar1 = ?,
      apgar5 = ?,
      complications = ?,
      delivered_at = COALESCE(?, NOW())
    WHERE id = ?
  `;

  const params = [
    delivery_type || null,
    outcome || null,
    (baby_weight_kg !== undefined ? baby_weight_kg : null),
    (apgar1 !== undefined ? apgar1 : null),
    (apgar5 !== undefined ? apgar5 : null),
    complications || null,
    delivered_at || null,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database error (updateDelivery):", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: "Admission not found" });
    res.json({ message: "Delivery details updated" });
  });
};

// Update admission details (general update)
const updateAdmission = (req, res) => {
  const { id } = req.params;
  const {
    patient_name,
    contact_number,
    admission_reason,
    pregnancy_cycle,
    room,
    status,
    notes,
    delivery_type,
    outcome,
    baby_weight_kg,
    apgar1,
    apgar5,
    complications,
    disposition
  } = req.body;

  if (admission_reason !== undefined) {
    const rs = String(admission_reason).toLowerCase();
    const tokens = ['labor','delivery','birth'];
    if (!tokens.some(t => rs.includes(t))) {
      return res.status(400).json({ error: "Admission restricted to birth-related cases only" });
    }
  }

  // Build dynamic update query
  const updateFields = [];
  const params = [];

  if (patient_name !== undefined) {
    updateFields.push('patient_name = ?');
    params.push(patient_name);
  }
  if (contact_number !== undefined) {
    updateFields.push('contact_number = ?');
    params.push(contact_number);
  }
  if (admission_reason !== undefined) {
    updateFields.push('admission_reason = ?');
    params.push(admission_reason);
  }
  if (pregnancy_cycle !== undefined) {
    updateFields.push('pregnancy_cycle = ?');
    params.push(pregnancy_cycle);
  }
  if (room !== undefined) {
    updateFields.push('room = ?');
    params.push(room);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    params.push(status);
  }
  if (notes !== undefined) {
    updateFields.push('notes = ?');
    params.push(notes);
  }
  if (delivery_type !== undefined) {
    updateFields.push('delivery_type = ?');
    params.push(delivery_type);
  }
  if (outcome !== undefined) {
    updateFields.push('outcome = ?');
    params.push(outcome);
  }
  if (baby_weight_kg !== undefined) {
    updateFields.push('baby_weight_kg = ?');
    params.push(baby_weight_kg);
  }
  if (apgar1 !== undefined) {
    updateFields.push('apgar1 = ?');
    params.push(apgar1);
  }
  if (apgar5 !== undefined) {
    updateFields.push('apgar5 = ?');
    params.push(apgar5);
  }
  if (complications !== undefined) {
    updateFields.push('complications = ?');
    params.push(complications);
  }
  if (disposition !== undefined) {
    updateFields.push('disposition = ?');
    params.push(disposition);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  // Add updated_at timestamp
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE admissions SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Database error (updateAdmission):", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Admission not found" });
    }
    res.json({ message: "Admission updated successfully" });
  });
};

// Delete an admission
const deleteAdmission = (req, res) => {
  const { id } = req.params;

  // First check if admission exists
  const checkSql = "SELECT id, status FROM admissions WHERE id = ?";
  db.query(checkSql, [id], (err, rows) => {
    if (err) {
      console.error("Database error (deleteAdmission - check):", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Admission not found" });
    }

    // Prevent deletion of discharged admissions for record keeping
    if (rows[0].status === 'discharged') {
      return res.status(400).json({ error: "Cannot delete discharged admissions for record keeping purposes" });
    }

    // Delete the admission
    const deleteSql = "DELETE FROM admissions WHERE id = ?";
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Database error (deleteAdmission):", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Admission deleted successfully" });
    });
  });
};

// Discharge an admission
const dischargeAdmission = (req, res) => {
  const { id } = req.params;
  const { disposition, discharge_notes, discharged_at } = req.body;

  const sql = `
    UPDATE admissions SET
      disposition = ?,
      discharge_notes = ?,
      discharged_at = COALESCE(?, NOW()),
      status = 'discharged'
    WHERE id = ?
  `;
  db.query(sql, [disposition || null, discharge_notes || null, discharged_at || null, id], (err, result) => {
    if (err) {
      console.error("Database error (dischargeAdmission):", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: "Admission not found" });
    res.json({ message: "Patient discharged" });
  });
};

// Get admissions by patient (for patient page)
const getAdmissionsByPatient = (req, res) => {
  const { patient_id } = req.params;
  
  const sql = `
    SELECT 
      a.id,
      a.booking_id,
      a.user_id,
      a.patient_name,
      a.contact_number,
      a.admission_reason,
      a.pregnancy_cycle,
      a.room,
      a.status,
      a.admitted_at,
      a.delivered_at,
      a.delivery_type,
      a.outcome,
      a.baby_weight_kg,
      a.apgar1,
      a.apgar5,
      a.complications,
      a.disposition,
      a.discharge_notes,
      a.discharged_at,
      a.created_at,
      a.updated_at,
      -- Patient information from patients table (for registered patients)
      CASE 
        WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
        ELSE a.patient_name
      END as display_patient_name,
      CASE 
        WHEN a.user_id > 0 THEN p.phone
        ELSE a.contact_number
      END as display_contact_number,
      CASE 
        WHEN a.user_id > 0 THEN p.email
        ELSE NULL
      END as patient_email,
      CASE 
        WHEN a.user_id > 0 THEN p.age
        ELSE NULL
      END as patient_age,
      CASE 
        WHEN a.user_id > 0 THEN p.gender
        ELSE NULL
      END as patient_gender,
      CASE 
        WHEN a.user_id > 0 THEN p.address
        ELSE NULL
      END as patient_address,
      CASE 
        WHEN a.user_id > 0 THEN p.blood_type
        ELSE NULL
      END as patient_blood_type,
      CASE 
        WHEN a.user_id > 0 THEN p.allergies
        ELSE NULL
      END as patient_allergies,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_name
        ELSE NULL
      END as emergency_contact_name,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_phone
        ELSE NULL
      END as emergency_contact_phone,
      CASE 
        WHEN a.user_id > 0 THEN p.emergency_contact_relationship
        ELSE NULL
      END as emergency_contact_relationship,
      -- Booking information
      b.service_type, 
      b.date as appointment_date, 
      b.time_slot,
      -- User information
      u.email as user_email,
      -- Patient type indicator
      CASE 
        WHEN a.user_id > 0 THEN 'registered'
        ELSE 'walk-in'
      END as patient_type
    FROM admissions a
    LEFT JOIN booking b ON a.booking_id = b.id
    LEFT JOIN patients p ON a.user_id = p.user_id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ? OR (a.user_id = 0 AND a.patient_name IS NOT NULL)
    ORDER BY a.admitted_at DESC
  `;

  db.query(sql, [patient_id], (err, rows) => {
    if (err) {
      console.error("Database error (getAdmissionsByPatient):", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};

module.exports = {
  createAdmission,
  listAdmissions,
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  updateDelivery,
  dischargeAdmission,
  getAdmissionsByPatient,
};



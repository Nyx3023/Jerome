const db = require("../config/db");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const MAX_WALKIN_DAY_CAPACITY = Number(process.env.WALKIN_DAY_CAPACITY || 10);

// Slot sequence for queue-based system (16 slots per day)
const SLOT_SEQUENCE = [
  'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
  'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
  'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
  'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
];

function isValidYYYYMMDD(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function ensureDayAvailable(date, callback = () => { }) {
  if (!date) return callback();
  const upsertCalendarSql = `
    INSERT INTO appointments (date, time, title, status)
    VALUES (?, '00:00:00', 'Available', 'available')
    ON DUPLICATE KEY UPDATE title = title, status = status
  `;
  db.query(upsertCalendarSql, [date], () => callback());
}

function getConsecutiveSlots(startSlot, count) {
  const startIndex = SLOT_SEQUENCE.indexOf(startSlot);
  if (startIndex === -1) return null;
  const endIndex = startIndex + count;
  if (endIndex > SLOT_SEQUENCE.length) return null;
  return SLOT_SEQUENCE.slice(startIndex, endIndex);
}

function getRequiredSlotsForDuration(durationMinutes) {
  const base = 30; // current granularity
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.max(1, Math.ceil(durationMinutes / base));
}

// Get all scheduled slots (available/holiday/notavailable/ob available for calendar)
const getSchedules = (req, res) => {
  db.query("SELECT id, title, date AS start, status FROM appointments WHERE status IN ('available','holiday','notavailable','ob available')", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
};

// Add or update Availability or Holiday
const addNotAvailableSlot = (req, res) => {
  const { date, status } = req.body;
  console.log('addNotAvailableSlot received:', { date, status });

  const statusLower = (status || '').toLowerCase();
  console.log('statusLower:', statusLower);

  // Normalize the status - support both 'not available' and 'holiday'
  let normalized;
  let title;

  if (statusLower === 'holiday') {
    normalized = 'holiday';
    title = 'Holiday';
  } else if (statusLower === 'not available' || statusLower === 'notavailable') {
    normalized = 'notavailable';  // MUST match database ENUM exactly
    title = 'Not Available';
  } else if (statusLower === 'ob available') {
    normalized = 'ob available';
    title = 'OB Available';
  } else {
    // Default to available if status is anything else
    normalized = 'available';
    title = 'Available';
  }

  console.log('Saving to DB:', { date, title, normalized });

  // First try to UPDATE existing record (match by date only)
  db.query(
    "UPDATE appointments SET title = ?, status = ? WHERE DATE(date) = DATE(?)",
    [title, normalized, date],
    (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Update Error:', updateErr);
        return res.status(500).json({ error: updateErr.sqlMessage || "Database error" });
      }

      console.log('Update result:', updateResult);

      // If no rows were updated, INSERT a new record
      if (updateResult.affectedRows === 0) {
        db.query(
          "INSERT INTO appointments (date, time, title, status) VALUES (?, '00:00:00', ?, ?)",
          [date, title, normalized],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Insert Error:', insertErr);
              return res.status(500).json({ error: insertErr.sqlMessage || "Database error" });
            }
            console.log('Insert result:', insertResult);
            res.json({ id: insertResult.insertId, date, title, status: normalized });
          }
        );
      } else {
        res.json({ date, title, status: normalized, updated: true });
      }
    }
  );
};

// Add or update "Holiday" slot (if needed separately)
const addHolidaySlot = (req, res) => {
  const { date, status } = req.body;
  const title = "Holiday";

  db.query(
    "INSERT INTO appointments (date, time, title, status) VALUES (?, '00:00:00', ?, ?) ON DUPLICATE KEY UPDATE title = ?, status = ?",
    [date, title, 'holiday', title, 'holiday'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
      res.json({ id: result.insertId, date, title, status });
    }
  );
};

// Delete a slot
const deleteSlot = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM appointments WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Slot deleted successfully" });
  });
};

const setDayCapacity = (req, res) => {
  const { date, slots } = req.body;
  const cap = Number(slots) || 0;
  const sql = "INSERT INTO appointments (date, time, title, status, slots) VALUES (?, '00:00:00', 'Available', 'available', ?) ON DUPLICATE KEY UPDATE title = 'Available', status = 'available', slots = ?";
  db.query(sql, [date, cap, cap], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
    res.json({ date, slots: cap });
  });
};

// Get all appointments
const getAllAppointments = (req, res) => {
  const sql = `
    SELECT 
      b.id,
      CASE 
        WHEN b.user_id IS NOT NULL AND b.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
        ELSE b.patient_name
      END AS patient_name,
      b.date,
      b.time_slot,
      b.request_status,
      b.appointment_status,
      b.checked_in_at,
      b.service_type AS session,
      b.user_id,
      b.cancel_reason,
      b.cancel_note,
      b.cancelled_at,
      b.cancelled_by,
      b.decline_reason,
      b.decline_note,
      b.declined_at,
      b.declined_by,
      b.is_ob_booking,
      b.ob_provider_type,
      b.follow_up_of_booking_id,
      b.follow_up_provider_type,
      p.age,
      p.expected_delivery_date,
      p.last_menstrual_period,
      af.rating AS feedback_rating,
      af.comment AS feedback_comment,
      CASE WHEN mn.id IS NOT NULL AND mn.vital_signs IS NOT NULL AND mn.vital_signs <> '' THEN 1 ELSE 0 END AS has_vitals
    FROM booking b
    LEFT JOIN appointment_feedback af ON af.booking_id = b.id
    LEFT JOIN medical_notes mn ON mn.booking_id = b.id
    LEFT JOIN patients p ON p.user_id = b.user_id
    ORDER BY b.date DESC, b.time_slot ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// Get appointments by date
const getAppointmentsByDate = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date parameter is required' });
  const sql = `
    SELECT 
      b.id,
      CASE 
        WHEN b.user_id IS NOT NULL AND b.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
        ELSE b.patient_name
      END AS patient_name,
      b.date,
      b.time_slot,
      b.request_status,
      b.appointment_status,
      b.service_type,
      b.user_id,
      b.follow_up_of_booking_id
    FROM booking b
    LEFT JOIN patients p ON p.user_id = b.user_id
    WHERE DATE(b.date) = ?
      AND (b.request_status IS NULL OR b.request_status != 'declined')
      AND (b.appointment_status IS NULL OR b.appointment_status != 'cancelled')
    ORDER BY b.time_slot ASC
  `;
  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Get blocked slots for a specific date
const getBlockedSlotsByDate = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date parameter is required' });
  const sql = `
    SELECT time_slot, status
    FROM slots
    WHERE DATE(date) = ? AND status = 'not_available'
    ORDER BY time_slot ASC
  `;
  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Update appointment request status
const updateRequestStatus = (req, res) => {
  const { id, status, decline_reason, decline_note } = req.body;

  // Determine appointment status based on request status
  const appointmentStatus = status === 'confirmed' ? 'ongoing' : 'null';

  // Guard: prevent action if appointment completed/cancelled or request not pending
  db.query('SELECT appointment_status, request_status FROM booking WHERE id = ? LIMIT 1', [id], (selErr, rows) => {
    if (selErr) {
      console.error('Database error:', selErr);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const currentApt = String(rows[0].appointment_status || '').toLowerCase();
    const currentReq = String(rows[0].request_status || '').toLowerCase();
    if (['completed', 'cancelled'].includes(currentApt)) {
      return res.status(409).json({ error: 'Cannot change request status for completed or cancelled appointments' });
    }
    if (currentReq !== 'pending') {
      return res.status(409).json({ error: 'Request status can only be changed while pending' });
    }

    let sql, params;
    if (status === 'declined') {
      sql = `
        UPDATE booking 
        SET request_status = ?,
            appointment_status = ?,
            decline_reason = ?,
            decline_note = ?,
            declined_by = 'admin',
            declined_at = NOW()
        WHERE id = ?
      `;
      params = [status, appointmentStatus, decline_reason || null, decline_note || null, id];
    } else {
      sql = `
        UPDATE booking 
        SET request_status = ?,
            appointment_status = ?
        WHERE id = ?
      `;
      params = [status, appointmentStatus, id];
    }
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json({ message: 'Status updated successfully' });
    });
  });
};

// Update appointment status
const updateAppointmentStatus = (req, res) => {
  const { id, status, cancel_reason, cancel_note } = req.body;
  const role = req.user?.role || 'admin';
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (status !== 'cancelled') {
    return res.status(403).json({ error: 'Only cancellation is allowed for admin/staff' });
  }
  const sql = `
    UPDATE booking 
    SET appointment_status = ?,
        cancel_reason = ?,
        cancel_note = ?,
        cancelled_by = ?,
        cancelled_at = NOW()
    WHERE id = ?
  `;
  const params = [status, cancel_reason || null, cancel_note || null, role, id];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment cancelled' });
  });
};

// Update appointment details (service, date, time, notes)
const updateAppointmentDetails = (req, res) => {
  const { id } = req.params;
  const { service_id, appointment_date, appointment_time, notes } = req.body;

  // Build dynamic SQL query based on provided fields
  let updateFields = [];
  let params = [];

  // Handle service update - need to get service_type from services table
  if (service_id && service_id !== '') {
    // First get the service name from the services table
    db.query('SELECT name FROM services WHERE id = ?', [service_id], (err, serviceResult) => {
      if (err) {
        console.error("Database error fetching service:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (serviceResult.length === 0) {
        return res.status(400).json({ error: "Invalid service ID" });
      }

      const serviceName = serviceResult[0].name;
      updateFields.push('service_type = ?');
      params.push(serviceName);

      // Continue with other field updates
      continueUpdate();
    });
  } else {
    // Continue with other field updates
    continueUpdate();
  }

  function continueUpdate() {
    // If date is being changed, we need to handle slot assignment
    const isDateChanging = appointment_date && appointment_date !== '';
    const hasTimeSlot = appointment_time && appointment_time !== '';

    // If date is changing and no new time slot specified, we need to find next available slot
    if (isDateChanging && !hasTimeSlot) {
      // Find next available slot on the new date
      const findSlotSql = `
        SELECT time_slot FROM booking 
        WHERE DATE(date) = ?
        AND id != ?
        AND (request_status IS NULL OR request_status != 'declined')
        AND (appointment_status IS NULL OR appointment_status != 'cancelled')
        UNION
        SELECT time_slot FROM slots 
        WHERE DATE(date) = ?
        AND status IN ('booked', 'not_available', 'pending')
      `;

      db.query(findSlotSql, [appointment_date, id, appointment_date], (slotErr, takenSlots) => {
        if (slotErr) {
          return res.status(500).json({ error: "Database error checking slots" });
        }

        const takenSet = new Set((takenSlots || []).map(s => s.time_slot));

        // Find first available slot
        let assignedSlot = null;
        for (let i = 1; i <= 16; i++) {
          const slotName = `Slot ${i}`;
          if (!takenSet.has(slotName)) {
            assignedSlot = slotName;
            break;
          }
        }

        if (!assignedSlot) {
          return res.status(400).json({ error: "All slots are fully booked for this date. Please choose a different date." });
        }

        // Add the auto-assigned slot to the update
        updateFields.push('date = ?');
        params.push(appointment_date);
        updateFields.push('time_slot = ?');
        params.push(assignedSlot);

        finishUpdate();
      });
    } else if (isDateChanging && hasTimeSlot) {
      // Validate the requested slot is available on the new date
      const validateSlotSql = `
        SELECT time_slot FROM booking 
        WHERE DATE(date) = ?
        AND time_slot = ?
        AND id != ?
        AND (request_status IS NULL OR request_status != 'declined')
        AND (appointment_status IS NULL OR appointment_status != 'cancelled')
        UNION
        SELECT time_slot FROM slots 
        WHERE DATE(date) = ?
        AND time_slot = ?
        AND status IN ('booked', 'not_available', 'pending')
      `;

      db.query(validateSlotSql, [appointment_date, appointment_time, id, appointment_date, appointment_time], (valErr, conflicts) => {
        if (valErr) {
          return res.status(500).json({ error: "Database error validating slot" });
        }

        if (conflicts && conflicts.length > 0) {
          return res.status(400).json({ error: `${appointment_time} is already booked on ${appointment_date}. Please select another slot.` });
        }

        updateFields.push('date = ?');
        params.push(appointment_date);
        updateFields.push('time_slot = ?');
        params.push(appointment_time);

        finishUpdate();
      });
    } else {
      // No date change, just update other fields
      if (appointment_time && appointment_time !== '') {
        updateFields.push('time_slot = ?');
        params.push(appointment_time);
      }

      finishUpdate();
    }

    function finishUpdate() {
      // Always allow notes to be updated (can be empty to clear notes)
      if (notes !== undefined) {
        updateFields.push('notes = ?');
        params.push(notes || null);
      }

      // If no fields to update, return error
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
      }

      const sql = `UPDATE booking SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(id);

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Appointment not found" });
        }
        res.json({ message: "Appointment updated successfully" });
      });
    }
  }
};


// Get all doctors
const getDoctors = (req, res) => {
  const sql = `
    SELECT d.id, d.name, d.specialization, d.email, 
           d.phone as contact, d.schedule, d.status,
           u.id as user_id
    FROM doctors d
    LEFT JOIN users u ON d.email = u.email
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching doctors:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
};

// Add new doctor
const addDoctor = (req, res) => {
  // Accept both 'phone' and 'contact' from client to avoid mismatch across UIs
  const { name, specialization, email, phone, contact, schedule } = req.body;
  const resolvedPhone = typeof phone !== 'undefined' && phone !== '' ? phone : (contact || null);
  const resolvedEmail = typeof email !== 'undefined' && email !== '' ? email : null;

  const insertWithColumn = (phoneColumn) => {
    const sql = `
      INSERT INTO doctors (name, specialization, email, ${phoneColumn}, schedule)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, specialization, resolvedEmail, resolvedPhone, schedule], (err, result) => {
      if (err) {
        console.error("Database error while inserting doctor:", err);
        return res.status(500).json({ error: err.sqlMessage || "Database error" });
      }
      res.status(201).json({ id: result.insertId, name, specialization, email: resolvedEmail, phone: resolvedPhone, contact: resolvedPhone, schedule });
    });
  };

  // Try inserting into 'contact'; if the column doesn't exist, retry with 'phone'
  const primaryColumn = 'contact';
  const fallbackColumn = 'phone';
  const sqlTest = `
    INSERT INTO doctors (name, specialization, email, ${primaryColumn}, schedule)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sqlTest, [name, specialization, resolvedEmail, resolvedPhone, schedule], (err, result) => {
    if (!err) {
      return res.status(201).json({ id: result.insertId, name, specialization, email: resolvedEmail, phone: resolvedPhone, contact: resolvedPhone, schedule });
    }
    // If bad field error, retry with fallback column
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      console.warn(`Column '${primaryColumn}' not found on doctors; retrying with '${fallbackColumn}'.`);
      return insertWithColumn(fallbackColumn);
    }
    console.error("Database error while inserting doctor:", err);
    return res.status(500).json({ error: err.sqlMessage || "Database error" });
  });
};


// Update doctor
const updateDoctor = (req, res) => {
  const { id } = req.params;
  const { name, specialization, contact, phone, schedule, license_number } = req.body;
  const resolvedContact = typeof contact !== 'undefined' && contact !== '' ? contact : (phone || null);

  // First get the doctor's email
  db.query("SELECT email FROM doctors WHERE id = ?", [id], (err, doctorResults) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (doctorResults.length === 0) return res.status(404).json({ error: "Doctor not found" });

    const doctorEmail = doctorResults[0].email;

    const updateWithColumn = (phoneColumn) => {
      const sql = `UPDATE doctors SET name = ?, specialization = ?, ${phoneColumn} = ?, schedule = ? WHERE id = ?`;
      db.query(sql, [name, specialization, resolvedContact, schedule, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Doctor not found" });

        // Update license_number in users table using email
        db.query(
          "UPDATE users SET license_number = ? WHERE email = ?",
          [license_number || null, doctorEmail],
          (err) => {
            if (err) console.error("Error updating user license_number:", err);
            res.json({ message: "Doctor updated successfully" });
          }
        );
      });
    };

    const primaryCol = 'contact';
    const fallbackCol = 'phone';
    const testSql = `UPDATE doctors SET name = ?, specialization = ?, ${primaryCol} = ?, schedule = ? WHERE id = ?`;
    db.query(testSql, [name, specialization, resolvedContact, schedule, id], (err, result) => {
      if (!err) {
        if (result.affectedRows === 0) return res.status(404).json({ error: "Doctor not found" });

        // Update license_number in users table using email
        db.query(
          "UPDATE users SET license_number = ? WHERE email = ?",
          [license_number || null, doctorEmail],
          (err) => {
            if (err) console.error("Error updating user license_number:", err);
            res.json({ message: "Doctor updated successfully" });
          }
        );
      } else if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        console.warn(`Column '${primaryCol}' not found on doctors; retrying update with '${fallbackCol}'.`);
        return updateWithColumn(fallbackCol);
      } else {
        return res.status(500).json({ error: err.sqlMessage || "Database error" });
      }
    });
  });
};

// Delete doctor
const deleteDoctor = (req, res) => {
  const { id } = req.params;

  // First check if doctor exists
  db.query("SELECT * FROM doctors WHERE id = ?", [id], (err, doctors) => {
    if (err) {
      console.error("Error checking doctor existence:", err);
      return res.status(500).json({ error: "Database error while checking doctor" });
    }

    if (doctors.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    console.log("Found doctor to delete:", doctors[0]);

    // Check if doctor has any associated user account
    const doctorEmail = doctors[0].email;

    // Start transaction to safely delete doctor and associated user
    db.beginTransaction((transErr) => {
      if (transErr) {
        console.error("Transaction error:", transErr);
        return res.status(500).json({ error: "Transaction error" });
      }

      // Delete from doctors table first
      db.query("DELETE FROM doctors WHERE id = ?", [id], (deleteErr, result) => {
        if (deleteErr) {
          console.error("Error deleting doctor:", deleteErr);
          return db.rollback(() => {
            res.status(500).json({ error: "Error deleting doctor: " + deleteErr.message });
          });
        }

        console.log("Doctor deleted from doctors table:", result);

        // Also delete associated user account if exists
        db.query("DELETE FROM users WHERE email = ? AND role = 'doctor'", [doctorEmail], (userErr, userResult) => {
          if (userErr) {
            console.error("Error deleting doctor user account:", userErr);
            // Don't fail the whole operation if user deletion fails
          } else {
            console.log("Doctor user account deleted:", userResult);
          }

          // Commit the transaction
          db.commit((commitErr) => {
            if (commitErr) {
              console.error("Commit error:", commitErr);
              return db.rollback(() => {
                res.status(500).json({ error: "Commit error" });
              });
            }

            console.log("Doctor deletion completed successfully");
            res.json({
              message: "Doctor deleted successfully",
              doctorDeleted: result.affectedRows > 0,
              userDeleted: userResult && userResult.affectedRows > 0
            });
          });
        });
      });
    });
  });
};

// Create doctor credentials
const createDoctorCredentials = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  console.log('Creating credentials for doctor ID:', id);
  console.log('Email:', email, 'Password length:', password?.length);

  try {
    // First check if the doctor exists
    db.query("SELECT * FROM doctors WHERE id = ?", [id], async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "Doctor not found" });

      // Enforce Gmail-only for doctor credentials
      const isGmail = /@gmail\.com$/i.test(email);
      console.log('Gmail check:', email, 'isGmail:', isGmail);
      if (!isGmail) {
        console.log('Rejecting non-Gmail:', email);
        return res.status(400).json({ error: "Only Gmail addresses are allowed for doctor accounts" });
      }

      // Check if user account already exists
      db.query("SELECT * FROM users WHERE email = ?", [email], async (err, users) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (users.length > 0) {
          console.log('Email already exists:', email, 'Current role:', users[0].role);
          if (users[0].role === 'doctor') {
            return res.status(400).json({ error: "Doctor account already exists for this email" });
          } else {
            return res.status(400).json({ error: `Email already registered as ${users[0].role}. Use a different email for the doctor account.` });
          }
        }

        // Create user account with doctor role
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const sql = "INSERT INTO users (name, email, password, role, doctor_id, email_verified, email_verification_token) VALUES (?, ?, ?, 'doctor', ?, 0, ?)";

        db.query(sql, [results[0].name, email, hashedPassword, id, verificationToken], (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Error creating doctor account" });
          }

          // Send verification email to the doctor
          sendVerificationEmail(email, verificationToken)
            .then(() => {
              res.status(201).json({ message: "Doctor account created. Please check email to verify before login." });
            })
            .catch((emailErr) => {
              console.error("Email error:", emailErr);
              res.status(201).json({ message: "Doctor account created. Please verify your email using the link." });
            });
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all services
const getServices = (req, res) => {
  const sql = "SELECT * FROM services ORDER BY name";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// Search patients by name/phone/email from unified patients table
const searchPatients = (req, res) => {
  const { search_term } = req.query;
  const term = (search_term || "").trim();
  if (term.length < 2) {
    return res.status(400).json({ error: "Search term must be at least 2 characters" });
  }

  const like = `%${term}%`;

  const query = `
    SELECT 
      p.id,
      p.user_id,
      TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) as name,
      p.email,
      p.phone,
      CASE WHEN p.user_id IS NULL THEN 'walk_in' ELSE 'registered' END AS patient_type,
      (
        SELECT COUNT(*) FROM booking b 
        WHERE b.user_id = p.user_id OR b.user_id = p.id 
           OR (b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AND b.contact_number = p.phone)
      ) AS total_appointments,
      (
        SELECT MAX(date) FROM booking b 
        WHERE b.user_id = p.user_id OR b.user_id = p.id 
           OR (b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AND b.contact_number = p.phone)
      ) AS last_visit
    FROM patients p
    WHERE TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) LIKE ? OR p.phone LIKE ? OR p.email LIKE ?
    ORDER BY last_visit IS NULL, last_visit DESC
    LIMIT 50
  `;

  db.query(query, [like, like, like], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// List ONLINE patients (registered users) by service_type
// Returns recent bookings for the given service where user_id is present
const getOnlinePatientsByService = (req, res) => {
  const { service_type } = req.query;
  if (!service_type) {
    return res.status(400).json({ error: "service_type query parameter is required" });
  }

  const sql = `
    SELECT 
      b.id AS booking_id,
      b.date,
      b.time_slot,
      b.request_status,
      b.appointment_status,
      b.service_type,
      b.patient_name,
      b.contact_number,
      b.user_id,
      u.email,
      p.id AS patient_id
    FROM booking b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN patients p ON p.user_id = b.user_id
    WHERE b.user_id IS NOT NULL AND b.service_type = ?
    ORDER BY b.date DESC, b.time_slot ASC
  `;

  db.query(sql, [service_type], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// Add new service
const addService = (req, res) => {
  const { name, description, category, price, duration } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const status = 'active'; // Explicitly define status

  const sql = `
    INSERT INTO services (name, description, category, price, duration, image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, description, category || 'general', price, duration, image, status], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.sqlMessage || "Database error" });
    }
    res.status(201).json({
      id: result.insertId,
      name,
      description,
      category: category || 'general',
      price,
      duration,
      image,
      status
    });
  });
};

// Update service
const updateService = (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, duration, status } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

  const sql = `
    UPDATE services 
    SET name = ?, description = ?, category = ?, price = ?, duration = ?, status = ?, image = ?
    WHERE id = ?
  `;

  db.query(sql, [name, description, category || 'general', price, duration, status, image, id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service updated successfully" });
  });
};

// Delete service
const deleteService = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM services WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  });
};

// Block a specific time slot (set as not available) for a date
const blockTimeSlot = (req, res) => {
  const { date, time_slot } = req.body;
  if (!date || !time_slot) {
    return res.status(400).json({ error: "date and time_slot are required" });
  }

  // Prevent blocking if there's already a booking on that slot
  const checkBooking = `
    SELECT id FROM booking
    WHERE date = ? AND time_slot = ?
      AND request_status != 'declined'
      AND appointment_status != 'cancelled'
    LIMIT 1
  `;

  db.query(checkBooking, [date, time_slot], (chkErr, rows) => {
    if (chkErr) {
      console.error("Database error:", chkErr);
      return res.status(500).json({ error: "Database error" });
    }
    if (rows && rows.length > 0) {
      return res.status(400).json({ error: "Slot already has a booking" });
    }

    const upsert = `
      INSERT INTO slots (date, time_slot, status)
      VALUES (?, ?, 'not_available')
      ON DUPLICATE KEY UPDATE status = 'not_available', booking_id = NULL
    `;
    db.query(upsert, [date, time_slot], (err) => {
      if (err) {
        console.error("Error blocking time slot:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Time slot blocked" });
    });
  });
};

// Unblock a specific time slot for a date
const unblockTimeSlot = (req, res) => {
  const { date, time_slot } = req.body;
  if (!date || !time_slot) {
    return res.status(400).json({ error: "date and time_slot are required" });
  }

  // Do not allow unblocking if it is currently booked
  const checkBookedSlot = `
    SELECT status FROM slots WHERE date = ? AND time_slot = ? LIMIT 1
  `;
  db.query(checkBookedSlot, [date, time_slot], (chkErr, rows) => {
    if (chkErr) {
      console.error("Database error:", chkErr);
      return res.status(500).json({ error: "Database error" });
    }
    const status = rows?.[0]?.status || null;
    if (status === 'booked') {
      return res.status(400).json({ error: "Cannot unblock a booked slot" });
    }

    const del = `
      DELETE FROM slots WHERE date = ? AND time_slot = ? AND (status IS NULL OR status != 'booked')
    `;
    db.query(del, [date, time_slot], (err) => {
      if (err) {
        console.error("Error unblocking time slot:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Time slot unblocked" });
    });
  });
};

// Create walk-in appointment (ensure a patients row exists; no conversion needed)
const createWalkIn = (req, res) => {
  const { patient_name, first_name, middle_name, last_name, contact_number, service_type, date, time_slot, existing_user_id, is_ob_booking, ob_provider_type } = req.body;

  const composedName = [first_name, middle_name, last_name].filter(Boolean).join(' ').trim();
  const finalPatientName = (composedName && composedName.length > 0) ? composedName : (patient_name || '').trim();
  const obBookingFlag = is_ob_booking ? 1 : 0;
  const obProviderType = ob_provider_type || null;

  if (!finalPatientName || !contact_number || !service_type || !date) {
    return res.status(400).json({ error: "Please fill in all the fields." });
  }
  if (!/^[0-9]{11}$/.test(contact_number)) {
    return res.status(400).json({ error: "Invalid contact number format. Please enter 11 digits." });
  }

  const uid = Number(existing_user_id) > 0 ? Number(existing_user_id) : null;

  const ensureUserPatientIfNeeded = (cb) => {
    if (!uid) return cb();
    const checkSql = `SELECT id FROM patients WHERE user_id = ? LIMIT 1`;
    db.query(checkSql, [uid], (cErr, cRows) => {
      if (cErr || (cRows && cRows.length > 0)) return cb();
      const tokens = finalPatientName.split(' ').filter(Boolean);
      const firstName = tokens[0] || '';
      const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
      const middle = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;
      const upsertSql = `INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, gender) SELECT u.id, ?, ?, ?, u.email, ?, 'female' FROM users u WHERE u.id = ?`;
      db.query(upsertSql, [firstName, middle, lastName, contact_number, uid], () => cb());
    });
  };

  const findOrCreatePatient = (cb) => {
    const findSql = `SELECT id FROM patients WHERE TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? AND phone = ? LIMIT 1`;
    db.query(findSql, [finalPatientName, contact_number], (findErr, rows) => {
      if (findErr) return cb(findErr);
      if (rows && rows.length > 0) return cb(null, rows[0].id);
      const tokens = finalPatientName.split(' ').filter(Boolean);
      const firstName = tokens[0] || '';
      const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
      const middle = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;
      const placeholderEmail = `walkin_${contact_number}@placeholder.local`;
      const insertSql = `INSERT INTO patients (first_name, middle_name, last_name, phone, email, gender) VALUES (?, ?, ?, ?, ?, 'unspecified')`;
      db.query(insertSql, [firstName, middle, lastName, contact_number, placeholderEmail], (insErr, insRes) => {
        if (insErr) return cb(insErr);
        cb(null, insRes.insertId);
      });
    });
  };

  const blockIfAlreadyBooked = (next) => {
    if (!uid) return next();
    const sql = `SELECT COUNT(*) AS cnt FROM booking WHERE user_id = ? AND date >= CURDATE() AND request_status IN ('pending','confirmed') AND (appointment_status IS NULL OR appointment_status NOT IN ('cancelled','completed'))`;
    db.query(sql, [uid], (e, r) => {
      if (e) return next();
      const cnt = r && r[0] && r[0].cnt ? Number(r[0].cnt) : 0;
      if (cnt > 0) return res.status(400).json({ error: "User already has an upcoming appointment. Please complete, cancel, or reschedule it before booking another." });
      next();
    });
  };

  blockIfAlreadyBooked(() => {
    db.beginTransaction((tErr) => {
      if (tErr) {
        return res.status(500).json({ error: "Database error" });
      }
      ensureUserPatientIfNeeded(() => {
        findOrCreatePatient((pErr, patientId) => {
          if (pErr) {
            return db.rollback(() => res.status(500).json({ error: "Error creating patient record" }));
          }
          const svcSql = "SELECT duration FROM services WHERE name = ? LIMIT 1";
          db.query(svcSql, [service_type], (sErr, sRows) => {
            const duration = (sErr ? 30 : Number(sRows?.[0]?.duration || 30));
            const requiredSlots = getRequiredSlotsForDuration(duration);
            const bookedSql = `SELECT time_slot FROM booking WHERE date = ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
            const blockedSql = `SELECT time_slot FROM slots WHERE date = ? AND status = 'not_available'`;
            db.query(bookedSql, [date], (bErr, bRows) => {
              if (bErr) return db.rollback(() => res.status(500).json({ error: "Error booking appointment" }));
              db.query(blockedSql, [date], (blErr, blRows) => {
                if (blErr) return db.rollback(() => res.status(500).json({ error: "Error booking appointment" }));
                const bookedSet = new Set((bRows || []).map(r => r.time_slot));
                const blockedSet = new Set((blRows || []).map(r => r.time_slot));
                let startSlot = null;
                if (time_slot) {
                  const seq = getConsecutiveSlots(time_slot, requiredSlots);
                  if (seq) {
                    let ok = true;
                    for (const t of seq) { if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; } }
                    if (ok) startSlot = time_slot;
                  }
                }
                if (!startSlot) {
                  for (const s of SLOT_SEQUENCE) {
                    const seq = getConsecutiveSlots(s, requiredSlots);
                    if (!seq) continue;
                    let ok = true;
                    for (const t of seq) { if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; } }
                    if (ok) { startSlot = s; break; }
                  }
                }
                if (!startSlot) return db.rollback(() => res.status(409).json({ error: "No available slot on selected date" }));
                const insertQuery = `INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, is_ob_booking, ob_provider_type) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'ongoing', ?, ?)`;
                db.query(insertQuery, [uid || 0, finalPatientName, contact_number, service_type, date, startSlot, obBookingFlag, obProviderType], (bookErr, result) => {
                  if (bookErr) {
                    return db.rollback(() => res.status(500).json({ error: "Error booking appointment" }));
                  }
                  db.commit((cErr) => {
                    if (cErr) {
                      return db.rollback(() => res.status(500).json({ error: "Error finalizing booking" }));
                    }
                    res.json({ message: "Walk-in appointment created successfully!", booking_id: result.insertId, patient_id: patientId });
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

// ================= WALK-IN QUEUE AND CHECK-IN/NO-SHOW =================

const { broadcast } = require('../utils/sse');

const addWalkInToQueue = (req, res) => {
  const { patient_name, contact_number, triage_level, notes, service_type, assign_immediately, auto_assign, date, time_slot, existing_user_id } = req.body;
  if (!patient_name || (contact_number && !/^\d{10,11}$/.test(String(contact_number)))) {
    return res.status(400).json({ error: 'patient_name is required; contact_number must be 10-11 digits if provided' });
  }

  const assignNow = assign_immediately === true || auto_assign === true || !!date || !!time_slot;
  if (assignNow) {
    const baseDate = (date && String(date).trim()) || new Date().toISOString().split('T')[0];
    const addDays = (d, n) => {
      const dt = new Date(d + 'T00:00:00');
      dt.setDate(dt.getDate() + n);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const tryDay = (dayOffset) => {
      if (dayOffset > 14) return res.status(409).json({ error: 'No available slot' });
      const targetDate = addDays(baseDate, dayOffset);
      const capSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND request_status IN ('pending','confirmed') AND appointment_status NOT IN ('cancelled')`;
      return db.query(capSql, [targetDate], (capErr, capRes) => {
        if (capErr) return res.status(500).json({ error: 'Database error' });
        if ((capRes?.[0]?.cnt || 0) >= MAX_WALKIN_DAY_CAPACITY) {
          const suggestSql = `SELECT date FROM appointments WHERE status = 'available' AND date > ? ORDER BY date ASC LIMIT 1`;
          return db.query(suggestSql, [targetDate], (sErr, sRows) => {
            const nextDate = sRows && sRows[0] && sRows[0].date ? sRows[0].date : null;
            return res.status(409).json({ error: 'No available slot', next_available_date: nextDate });
          });
        }
        ensureDayAvailable(targetDate, () => {
          const safeContact = (contact_number && String(contact_number).trim()) || '00000000000';
          const fullName = String(patient_name).trim();
          const tokens = fullName.split(' ').filter(Boolean);
          const firstName = tokens[0] || '';
          const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
          const middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;

          // Ensure a patients row exists for walk-in (user_id NULL)
          const findPatientSql = `SELECT id FROM patients WHERE phone = ? AND TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? LIMIT 1`;
          db.query(findPatientSql, [safeContact, fullName], (findErr, rows) => {
            if (findErr) {
              // Continue booking even if patient upsert fails
              console.error('Walk-in patient lookup error:', findErr);
            }
            const createIfMissing = (next) => {
              if (rows && rows.length > 0) return next(rows[0].id);
              // Generate a placeholder email for walk-in patients
              const placeholderEmail = `walkin_${safeContact}@placeholder.local`;
              const insertPatientSql = `INSERT INTO patients (first_name, middle_name, last_name, phone, email, gender) VALUES (?, ?, ?, ?, ?, 'unspecified')`;
              db.query(insertPatientSql, [firstName, middleName, lastName, safeContact, placeholderEmail], (insErr, insRes) => {
                if (insErr) {
                  console.error('Walk-in patient insert error:', insErr);
                  return next(null);
                }
                return next(insRes.insertId);
              });
            };

            createIfMissing(() => {
              const svcSql = "SELECT duration FROM services WHERE name = ? LIMIT 1";
              db.query(svcSql, [service_type || 'General Consultation'], (sErr, sRows) => {
                const duration = (sErr ? 30 : Number(sRows?.[0]?.duration || 30));
                const requiredSlots = getRequiredSlotsForDuration(duration);
                const bookedSql = `SELECT time_slot FROM booking WHERE date = ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
                const blockedSql = `SELECT time_slot FROM slots WHERE date = ? AND status = 'not_available'`;
                db.query(bookedSql, [targetDate], (bErr, bRows) => {
                  if (bErr) return res.status(500).json({ error: 'Database error' });
                  db.query(blockedSql, [targetDate], (blErr, blRows) => {
                    if (blErr) return res.status(500).json({ error: 'Database error' });
                    const bookedSet = new Set((bRows || []).map(r => r.time_slot));
                    const blockedSet = new Set((blRows || []).map(r => r.time_slot));
                    let startSlot = null;
                    if (time_slot) {
                      const seq = getConsecutiveSlots(time_slot, requiredSlots);
                      if (seq) {
                        let ok = true;
                        for (const t of seq) { if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; } }
                        if (ok) startSlot = time_slot;
                      }
                    }
                    if (!startSlot) {
                      for (const s of SLOT_SEQUENCE) {
                        const seq = getConsecutiveSlots(s, requiredSlots);
                        if (!seq) continue;
                        let ok = true;
                        for (const t of seq) { if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; } }
                        if (ok) { startSlot = s; break; }
                      }
                    }
                    if (!startSlot) return res.status(409).json({ error: 'No available slot' });
                    const insertBooking = `
                      INSERT INTO booking (
                        user_id,
                        patient_name,
                        contact_number,
                        service_type,
                        date,
                        time_slot,
                        request_status,
                        appointment_status
                      ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'ongoing')
                    `;
                    const uid = Number(existing_user_id) > 0 ? Number(existing_user_id) : 0;
                    db.query(insertBooking, [uid, fullName, safeContact, service_type || 'General Consultation', targetDate, startSlot], (bookErr, bookRes) => {
                      if (bookErr) return res.status(500).json({ error: 'Database error', error_code: bookErr.code, message: bookErr.sqlMessage });
                      const bookingId = bookRes.insertId;
                      broadcast('queue_update', { type: 'booking_added', booking_id: bookingId, service_type: service_type || 'General Consultation' });
                      return res.status(200).json({
                        message: 'Walk-in created',
                        booking: { id: bookingId, date: targetDate, time_slot: startSlot, patient_name: fullName }
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
    return tryDay(0);
  }
  return res.status(409).json({ error: 'No available slot' });
};

// Pick next walk-in (urgent first, then earliest arrival) and assign the next available slot
const callNextWalkIn = (req, res) => {
  const { service_type, date } = req.body;
  const targetDate = (date && date.trim()) || new Date().toISOString().split('T')[0];
  const nextWalkInSql = `
    SELECT * FROM walkin_queue
    WHERE status = 'waiting' AND service_type = ?
    ORDER BY (triage_level = 'urgent') DESC, arrival_time ASC
    LIMIT 1
  `;
  db.query(nextWalkInSql, [service_type || 'General Consultation'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No walk-in in queue' });
    }
    const walkin = rows[0];
    const svcSql = "SELECT duration FROM services WHERE name = ? LIMIT 1";
    db.query(svcSql, [service_type || 'General Consultation'], (sErr, sRows) => {
      const duration = (sErr ? 30 : Number(sRows?.[0]?.duration || 30));
      const requiredSlots = getRequiredSlotsForDuration(duration);
      const bookedSql = `SELECT time_slot FROM booking WHERE date = ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
      const blockedSql = `SELECT time_slot FROM slots WHERE date = ? AND status = 'not_available'`;
      db.query(bookedSql, [targetDate], (bErr, bRows) => {
        if (bErr) return res.status(500).json({ error: 'Database error' });
        db.query(blockedSql, [targetDate], (blErr, blRows) => {
          if (blErr) return res.status(500).json({ error: 'Database error' });
          const bookedSet = new Set((bRows || []).map(r => r.time_slot));
          const blockedSet = new Set((blRows || []).map(r => r.time_slot));
          let startSlot = null;
          for (const s of SLOT_SEQUENCE) {
            const seq = getConsecutiveSlots(s, requiredSlots);
            if (!seq) continue;
            let ok = true;
            for (const t of seq) { if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; } }
            if (ok) { startSlot = s; break; }
          }
          if (!startSlot) return res.status(409).json({ error: 'No available slot' });
          const insertBooking = `
            INSERT INTO booking (
              user_id,
              patient_name,
              contact_number,
              service_type,
              date,
              time_slot,
              request_status,
              appointment_status
            ) VALUES (0, ?, ?, ?, ?, ?, 'confirmed', 'ongoing')
          `;
          db.query(insertBooking, [walkin.patient_name, walkin.contact_number || null, service_type || 'General Consultation', targetDate, startSlot], (bookErr, bookRes) => {
            if (bookErr) {
              return res.status(500).json({ error: 'Database error' });
            }
            const bookingId = bookRes.insertId;
            const updQueue = `UPDATE walkin_queue SET status = 'called', assigned_booking_id = ? WHERE id = ?`;
            db.query(updQueue, [bookingId, walkin.id], (updErr) => {
              if (updErr) {
                return res.status(500).json({ error: 'Database error' });
              }
              broadcast('queue_update', { type: 'walkin_called', walkin_id: walkin.id, booking_id: bookingId, service_type: service_type || 'General Consultation' });
              return res.json({
                message: 'Walk-in called',
                booking: { id: bookingId, date: targetDate, time_slot: startSlot, patient_name: walkin.patient_name },
                walkin_id: walkin.id
              });
            });
          });
        });
      });
    });
  });
};

// Mark a booking as checked-in (sets checked_in_at)
const checkInBooking = (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ error: 'booking_id is required' });
  }
  const sql = `UPDATE booking SET checked_in_at = NOW(), appointment_status = 'ongoing' WHERE id = ?`;
  db.query(sql, [booking_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    broadcast('queue_update', { type: 'booking_checked_in', booking_id });
    return res.json({ message: 'Booking checked-in' });
  });
};

// Release a no-show slot (after grace), optionally to next walk-in (frontend can call call-next)
const releaseNoShow = (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ error: 'booking_id is required' });
  }

  // Find the booking info
  const getBooking = `SELECT id, date, time_slot, checked_in_at FROM booking WHERE id = ? LIMIT 1`;
  db.query(getBooking, [booking_id], (err, rows) => {
    if (err) {
      console.error('Error loading booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const b = rows[0];
    if (b.checked_in_at) {
      return res.status(400).json({ error: 'Booking already checked-in' });
    }

    const freeSlot = `DELETE FROM slots WHERE date = ? AND time_slot = ? AND booking_id = ?`;
    db.query(freeSlot, [b.date, b.time_slot, booking_id], (freeErr) => {
      if (freeErr) {
        console.error('Error freeing slot:', freeErr);
        return res.status(500).json({ error: 'Database error' });
      }

      // Mark booking as cancelled due to no-show
      const markNoShow = `
        UPDATE booking
        SET appointment_status = 'cancelled', cancel_reason = 'no_show', cancelled_by = 'admin', cancelled_at = NOW()
        WHERE id = ?
      `;
      db.query(markNoShow, [booking_id], (updErr) => {
        if (updErr) {
          console.error('Error marking no-show:', updErr);
          return res.status(500).json({ error: 'Database error' });
        }
        broadcast('queue_update', { type: 'booking_no_show_released', booking_id })
        return res.json({ message: 'Slot released and booking marked as no-show' });
      });
    });
  });
};

const getQueueStatus = (req, res) => {
  const { service_type } = req.query
  const sql = `
    SELECT 
      SUM(appointment_status != 'cancelled' AND request_status IN ('pending','confirmed') AND checked_in_at IS NULL) AS waiting,
      SUM(appointment_status = 'ongoing' AND checked_in_at IS NOT NULL) AS called
    FROM booking
    WHERE service_type = ?
  `
  db.query(sql, [service_type || 'General Consultation'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    const waiting = rows && rows[0] && rows[0].waiting ? Number(rows[0].waiting) : 0
    const called = rows && rows[0] && rows[0].called ? Number(rows[0].called) : 0
    const avgMap = { 'General Consultation': 20, 'Prenatal Checkup': 20, 'Postnatal Checkup': 15, 'Ultrasound': 30, 'Immunization': 15 }
    const avg = avgMap[service_type || 'General Consultation'] || 20
    const estimated_wait_minutes = waiting * avg
    res.json({ service_type: service_type || 'General Consultation', waiting, called, estimated_wait_minutes })
  })
}

function sendVerificationEmail(toEmail, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to: toEmail,
    subject: 'Verify your email address',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Verify Your Email Address</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Please verify your email address by clicking the button below.
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verifyLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <span style="word-break: break-all; color: #4F46E5;">${verifyLink}</span>
                    </p>
                </div>
            </div>
        `
  };

  return transporter.sendMail(mailOptions);
}

// Get patient profile by user ID
const getPatientProfile = (req, res) => {
  const { userId } = req.params;

  // Try to find by user_id first, then by patient.id if not found
  const query = `
        SELECT 
            p.*,
            u.email,
            (SELECT COUNT(*) FROM booking b WHERE b.user_id = p.user_id OR b.user_id = p.id) as total_visits,
            (SELECT MAX(date) FROM booking b WHERE b.user_id = p.user_id OR b.user_id = p.id) as last_visit
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ? OR p.id = ?
        LIMIT 1
    `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      // If no patient profile found, try to auto-create one
      const { getOrCreatePatientIdByUserId } = require('../utils/patientAutoLink');

      getOrCreatePatientIdByUserId(userId)
        .then(patientId => {
          // Now fetch the newly created profile
          db.query(query, [userId, userId], (err, newResults) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ error: "Database error" });
            }

            if (newResults.length === 0) {
              return res.status(404).json({ error: "Patient profile not found after creation" });
            }

            res.json(newResults[0]);
          });
        })
        .catch(err => {
          console.error("Auto-creation error:", err);
          if (err.statusCode === 404) {
            return res.status(404).json({ error: "User not found" });
          }
          return res.status(500).json({ error: "Database error" });
        });
    } else {
      res.json(results[0]);
    }
  });
};

// Get all patients (unified from patients table)
const getAllPatients = (req, res) => {
  // Show walk-ins always; show registered users only if they have completed consultation
  // Compute consultation completion dynamically to avoid dependency on missing columns
  const query = `
    SELECT * FROM (
      SELECT 
        p.id,
        p.user_id,
        TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AS name,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.phone,
        p.age,
        p.gender,
        p.address,
        u.email,
        (
          SELECT MAX(b.date) 
          FROM booking b 
          WHERE 
            (p.user_id IS NOT NULL AND b.user_id = p.user_id)
            OR (p.user_id IS NULL AND b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AND b.contact_number = p.phone)
        ) AS first_consultation_date,
        (
          SELECT COUNT(*) FROM booking b 
          WHERE 
            (p.user_id IS NOT NULL AND b.user_id = p.user_id)
            OR (p.user_id IS NULL AND b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AND b.contact_number = p.phone)
        ) AS total_visits,
        (
          SELECT MAX(b.date) 
          FROM booking b 
          WHERE 
            (p.user_id IS NOT NULL AND b.user_id = p.user_id)
            OR (p.user_id IS NULL AND b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) AND b.contact_number = p.phone)
        ) AS last_visit,
        (
          SELECT EXISTS (
            SELECT 1 FROM booking b 
            WHERE 
              (
                p.user_id IS NOT NULL AND b.user_id = p.user_id AND b.appointment_status = 'completed'
              )
              OR (
                p.user_id IS NULL 
                AND b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) 
                AND b.contact_number = p.phone 
                AND b.appointment_status = 'completed'
              )
          )
        ) AS consultation_completed,
        CASE WHEN p.user_id IS NULL THEN 'walk_in' ELSE 'registered' END AS patient_type
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
    ) as full_list
    WHERE (patient_type = 'walk_in') OR (patient_type = 'registered')
    ORDER BY name
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// Create a registered patient (admin/staff/doctor)
const createPatient = (req, res) => {
  const { first_name, middle_name, last_name, email, phone, age, gender, address } = req.body;
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "first_name, last_name, and email are required" });
  }
  // Insert into users as 'user' with no password/login (placeholder) OR attach to existing user if any
  // For simplicity, create patient row only; user account can be created later by auth flow.
  const sql = `INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, age, gender, address)
               VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [first_name, middle_name || null, last_name, email, phone || null, age || null, gender || null, address || null];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating patient:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Patient added' });
  });
};

function sendDoctorWelcomeEmail(toEmail, password, doctorName) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginLink = `${baseUrl}/login`;

  // Correct nodemailer API
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to: toEmail,
    subject: 'Welcome! Your Doctor Account Has Been Created',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Our Medical System!</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        Dear Dr. ${doctorName},
                    </p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Your doctor account has been successfully created by our administrator. You can now access the system using the credentials below:
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <p style="margin: 0; color: #333;"><strong>Email:</strong> ${toEmail}</p>
                        <p style="margin: 10px 0 0 0; color: #333;"><strong>Password:</strong> ${password}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${loginLink}" style="display: inline-block; background-color: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Login to Dashboard
                        </a>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        For security reasons, we recommend changing your password after your first login.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">
                        If you have any questions, please contact the administrator.
                    </p>
                </div>
            </div>
        `
  };

  return transporter.sendMail(mailOptions);
}

function sendPatientWelcomeEmail(toEmail, password, patientName) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginLink = `${baseUrl}/login`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to: toEmail,
    subject: 'Welcome! Your Patient Account Has Been Created',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Our Medical System!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Dear ${patientName || 'Patient'},</p>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Your patient account has been created by our administrator. You can access the system using the credentials below:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <p style="margin: 0; color: #333;"><strong>Email:</strong> ${toEmail}</p>
                        <p style="margin: 10px 0 0 0; color: #333;"><strong>Password:</strong> ${password}</p>
                    </div>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${loginLink}" style="display: inline-block; background-color: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login</a>
                    </div>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">Please change your password after your first login.</p>
                </div>
            </div>
        `
  };

  return transporter.sendMail(mailOptions);
}

const createPatientAccount = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  db.query('SELECT id, user_id, first_name, middle_name, last_name FROM patients WHERE id = ? LIMIT 1', [id], async (findErr, rows) => {
    if (findErr) {
      console.error('Database error:', findErr);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const patient = rows[0];
    if (patient.user_id) {
      return res.status(400).json({ error: 'Patient already has an account' });
    }

    db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail], async (checkErr, existing) => {
      if (checkErr) {
        console.error('Database error:', checkErr);
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      try {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const insertUserSql = 'INSERT INTO users (email, password, role, email_verified, email_verification_token) VALUES (?, ?, ?, ?, ?)';
        db.query(insertUserSql, [normalizedEmail, hashedPassword, 'user', 0, verificationToken], (insErr, result) => {
          if (insErr) {
            console.error('Database error:', insErr);
            return res.status(500).json({ error: 'Database error' });
          }
          const userId = result.insertId;

          const checkColSql = "SHOW COLUMNS FROM users LIKE 'must_change_password'";
          db.query(checkColSql, (colErr, colRows) => {
            if (colErr) {
              console.warn('Column check failed:', colErr);
            }
            const hasCol = Array.isArray(colRows) && colRows.length > 0;
            const ensureCol = (cb) => {
              if (hasCol) return cb();
              const alterSql = "ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0";
              db.query(alterSql, (alterErr) => {
                if (alterErr) console.warn('Failed to add must_change_password column:', alterErr);
                cb();
              });
            };

            ensureCol(() => {
              const setFlagSql = 'UPDATE users SET must_change_password = 1 WHERE id = ?';
              db.query(setFlagSql, [userId], () => {
                const updatePatientSql = 'UPDATE patients SET user_id = ?, email = ? WHERE id = ?';
                db.query(updatePatientSql, [userId, normalizedEmail, id], (updErr) => {
                  if (updErr) {
                    console.error('Database error:', updErr);
                    return res.status(500).json({ error: 'Database error' });
                  }

                  sendVerificationEmail(normalizedEmail, verificationToken)
                    .then(() => {
                      res.status(201).json({ message: 'Account created. Verification email sent.', user_id: userId });
                    })
                    .catch(() => {
                      res.status(201).json({ message: 'Account created. Please verify via the email link.', user_id: userId });
                    });
                });
              });
            });
          });
        });
      } catch (e) {
        console.error('Error:', e);
        return res.status(500).json({ error: 'Server error' });
      }
    });
  });
};

// ========== STAFF MANAGEMENT FUNCTIONS ==========

// Get all staff
const getStaff = (req, res) => {
  const sql = `
    SELECT s.id, s.name, s.position, s.email, s.phone, 
           s.status, s.created_at,
           u.id as user_id
    FROM staff s
    LEFT JOIN users u ON s.email = u.email
    ORDER BY s.name ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching staff:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
};

// Add new staff member
const addStaff = (req, res) => {
  const { name, position, email, phone, license_number } = req.body;

  // Check if license_number column exists in staff table
  const sql = `
    INSERT INTO staff (name, position, email, phone, license_number)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, position, email, phone, license_number || null], (err, result) => {
    if (err) {
      // If license_number column doesn't exist, try without it
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = `INSERT INTO staff (name, position, email, phone) VALUES (?, ?, ?, ?)`;
        db.query(fallbackSql, [name, position, email, phone], (err2, result2) => {
          if (err2) {
            console.error("Database error:", err2);
            return res.status(500).json({ error: err2.sqlMessage || "Database error" });
          }
          res.status(201).json({ id: result2.insertId, name, position, email, phone });
        });
      } else {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.sqlMessage || "Database error" });
      }
    } else {
      res.status(201).json({ id: result.insertId, name, position, email, phone, license_number });
    }
  });
};

// Update staff member
const updateStaff = (req, res) => {
  const { id } = req.params;
  const { name, position, email, phone, license_number } = req.body;

  // Try updating with license_number first
  db.query(
    "UPDATE staff SET name = ?, position = ?, email = ?, phone = ?, license_number = ? WHERE id = ?",
    [name, position, email, phone, license_number || null, id],
    (err, result) => {
      // If license_number column doesn't exist, try without it
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        db.query(
          "UPDATE staff SET name = ?, position = ?, email = ?, phone = ? WHERE id = ?",
          [name, position, email, phone, id],
          (err2, result2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            if (result2.affectedRows === 0) return res.status(404).json({ error: "Staff member not found" });
            res.json({ message: "Staff member updated successfully" });
          }
        );
      } else if (err) {
        return res.status(500).json({ error: "Database error" });
      } else {
        if (result.affectedRows === 0) return res.status(404).json({ error: "Staff member not found" });
        res.json({ message: "Staff member updated successfully" });
      }
    }
  );
};

// Delete staff member
const deleteStaff = (req, res) => {
  const { id } = req.params;

  // First check if staff member exists
  db.query("SELECT * FROM staff WHERE id = ?", [id], (err, staff) => {
    if (err) {
      console.error("Database error checking staff:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (staff.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    console.log("Found staff member to delete:", staff[0]);

    const staffEmail = staff[0].email;

    // Check if staff member has a user account
    db.query("SELECT id FROM users WHERE email = ? AND role = 'staff'", [staffEmail], (userErr, userResults) => {
      if (userErr) {
        console.error("Error checking user account:", userErr);
        return res.status(500).json({ error: "Database error checking user account" });
      }

      // Delete from staff table first
      db.query("DELETE FROM staff WHERE id = ?", [id], (deleteErr, result) => {
        if (deleteErr) {
          console.error("Error deleting staff member:", deleteErr);
          return res.status(500).json({ error: "Error deleting staff member" });
        }

        console.log("Staff member deleted from staff table:", result);

        // If staff member had a user account, delete it too
        if (userResults.length > 0) {
          const userId = userResults[0].id;
          db.query("DELETE FROM users WHERE id = ?", [userId], (userDeleteErr) => {
            if (userDeleteErr) {
              console.error("Error deleting user account:", userDeleteErr);
              // Don't return error here, staff deletion was successful
            }
            console.log("Associated user account deleted");
          });
        }

        res.json({ message: "Staff member deleted successfully" });
      });
    });
  });
};

// Create or update staff credentials (user account)
const createStaffCredentials = (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  db.query("SELECT * FROM staff WHERE id = ?", [id], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const staff = results[0];

    try {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // If staff already has user_id, update existing user
      if (staff.user_id) {
        // Check if the email is changing and if new email already exists
        db.query("SELECT email FROM users WHERE id = ?", [staff.user_id], (emailErr, emailResults) => {
          if (emailErr) {
            return res.status(500).json({ error: "Database error checking current email" });
          }

          const currentEmail = emailResults[0]?.email;

          // If email is changing, check if new email exists for other users
          if (currentEmail !== email) {
            db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, staff.user_id], (checkErr, existingUsers) => {
              if (checkErr) {
                return res.status(500).json({ error: "Database error checking existing user" });
              }

              if (existingUsers.length > 0) {
                return res.status(400).json({ error: "A user with this email already exists" });
              }

              // Update existing user and require re-verification for new email
              const verificationToken = crypto.randomBytes(32).toString('hex');
              db.query(
                "UPDATE users SET email = ?, password = ?, email_verified = 0, email_verification_token = ? WHERE id = ?",
                [email, hashedPassword, verificationToken, staff.user_id],
                (updateErr) => {
                  if (updateErr) {
                    console.error("Error updating user:", updateErr);
                    return res.status(500).json({ error: "Error updating user account" });
                  }

                  // Send verification email to the updated email address
                  sendVerificationEmail(email, verificationToken)
                    .then(() => {
                      res.json({
                        message: "Staff credentials updated. Please verify the new email before login.",
                        userId: staff.user_id
                      });
                    })
                    .catch((emailErr) => {
                      console.error("Email error:", emailErr);
                      res.json({
                        message: "Staff credentials updated. Please verify your email using the link.",
                        userId: staff.user_id
                      });
                    });
                }
              );
            });
          } else {
            // Email not changing, just update password
            db.query(
              "UPDATE users SET password = ? WHERE id = ?",
              [hashedPassword, staff.user_id],
              (updateErr) => {
                if (updateErr) {
                  console.error("Error updating user password:", updateErr);
                  return res.status(500).json({ error: "Error updating user password" });
                }

                res.json({
                  message: "Staff password updated successfully",
                  userId: staff.user_id
                });
              }
            );
          }
        });
      } else {
        // Create new user account
        // Check if user already exists
        db.query("SELECT id FROM users WHERE email = ?", [email], async (checkErr, existingUsers) => {
          if (checkErr) {
            return res.status(500).json({ error: "Database error checking existing user" });
          }

          if (existingUsers.length > 0) {
            return res.status(400).json({ error: "A user with this email already exists" });
          }

          // Create user account requiring email verification
          const verificationToken = crypto.randomBytes(32).toString('hex');
          db.query(
            "INSERT INTO users (email, password, role, email_verified, email_verification_token) VALUES (?, ?, 'staff', 0, ?)",
            [email, hashedPassword, verificationToken],
            (userErr, userResult) => {
              if (userErr) {
                console.error("Error creating user:", userErr);
                return res.status(500).json({ error: "Error creating user account" });
              }

              // Update staff record with user_id
              db.query(
                "UPDATE staff SET user_id = ? WHERE id = ?",
                [userResult.insertId, id],
                (updateErr) => {
                  if (updateErr) {
                    console.error("Error updating staff with user_id:", updateErr);
                    // Clean up created user
                    db.query("DELETE FROM users WHERE id = ?", [userResult.insertId]);
                    return res.status(500).json({ error: "Error linking staff to user account" });
                  }

                  // Send verification email to staff
                  sendVerificationEmail(email, verificationToken)
                    .then(() => {
                      res.json({
                        message: "Staff account created. Please check email to verify before login.",
                        userId: userResult.insertId
                      });
                    })
                    .catch((emailErr) => {
                      console.error("Email error:", emailErr);
                      res.json({
                        message: "Staff account created. Please verify your email using the link.",
                        userId: userResult.insertId
                      });
                    });
                }
              );
            }
          );
        });
      }
    } catch (error) {
      console.error("Error in createStaffCredentials:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
};

// Update a user's role (admin-only)
const updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};

  const validRoles = ['admin', 'staff', 'doctor', 'user'];
  const newRole = (role || '').toLowerCase();
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  db.query('SELECT id, email, role, name FROM users WHERE id = ?', [id], (findErr, users) => {
    if (findErr) return res.status(500).json({ error: 'Database error' });
    if (!users || users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const email = user.email;
    const displayName = user.name || (email ? email.split('@')[0] : 'User');

    if (String(user.role).toLowerCase() === newRole) {
      return res.json({ message: 'Role unchanged', role: newRole });
    }

    db.beginTransaction((txErr) => {
      if (txErr) return res.status(500).json({ error: 'Transaction error' });

      db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, id], (updErr) => {
        if (updErr) {
          return db.rollback(() => res.status(500).json({ error: 'Failed to update role' }));
        }

        const commitOrRollback = (err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ error: 'Database error' }));
          }
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => res.status(500).json({ error: 'Commit error' }));
            }
            res.json({ message: 'Role updated successfully', role: newRole });
          });
        };

        if (newRole === 'staff') {
          // Link or create staff record for this email, and attach user_id
          db.query('SELECT id, user_id FROM staff WHERE email = ?', [email], (sErr, sRows) => {
            if (sErr) return commitOrRollback(sErr);
            if (!sRows || sRows.length === 0) {
              db.query(
                'INSERT INTO staff (name, position, email, phone, user_id) VALUES (?, ?, ?, ?, ?)',
                [displayName, 'Staff', email, null, id],
                (insErr) => commitOrRollback(insErr)
              );
            } else {
              const s = sRows[0];
              if (!s.user_id || Number(s.user_id) === 0) {
                db.query('UPDATE staff SET user_id = ? WHERE id = ?', [id, s.id], (linkErr) => commitOrRollback(linkErr));
              } else {
                commitOrRollback(null);
              }
            }
          });
        } else if (newRole === 'doctor') {
          // Ensure doctor profile exists and attach doctor_id to users
          db.query('SELECT id FROM doctors WHERE email = ?', [email], (dErr, dRows) => {
            if (dErr) return commitOrRollback(dErr);
            const finalizeWithDoctorId = (doctorId) => {
              if (doctorId && Number(doctorId) > 0) {
                db.query('UPDATE users SET doctor_id = ? WHERE id = ?', [doctorId, id], (setErr) => commitOrRollback(setErr));
              } else {
                commitOrRollback(null);
              }
            };

            if (!dRows || dRows.length === 0) {
              // Create minimal doctor profile; handle contact/phone column differences
              const nameVal = displayName;
              const specialization = '';
              const schedule = '';
              const tryPrimary = `INSERT INTO doctors (name, specialization, email, contact, schedule) VALUES (?, ?, ?, ?, ?)`;
              db.query(tryPrimary, [nameVal, specialization, email, null, schedule], (insErr, insRes) => {
                if (!insErr) return finalizeWithDoctorId(insRes.insertId);
                if (insErr && insErr.code === 'ER_BAD_FIELD_ERROR') {
                  const tryFallback = `INSERT INTO doctors (name, specialization, email, phone, schedule) VALUES (?, ?, ?, ?, ?)`;
                  db.query(tryFallback, [nameVal, specialization, email, null, schedule], (fbErr, fbRes) => finalizeWithDoctorId(fbErr ? null : fbRes.insertId));
                } else {
                  finalizeWithDoctorId(null);
                }
              });
            } else {
              finalizeWithDoctorId(dRows[0].id);
            }
          });
        } else {
          // Admin or user: nothing extra to link
          commitOrRollback(null);
        }
      });
    });
  });
};

// ================= WALK-IN PATIENT DATA MANAGEMENT =================

function resolvePregnancyIdForDateWalkin(patientId, dateString, done) {
  const d = dateString ? new Date(dateString) : null;
  if (!patientId || !d) return done(null, null);

  // Check babies table first
  const babiesSql = `SELECT birth_date FROM babies WHERE mother_patient_id = ? AND birth_date IS NOT NULL ORDER BY birth_date ASC`;
  db.query(babiesSql, [patientId], (bErr, bRows) => {
    if (bErr) return done(bErr);
    const births = (bRows || []).map(r => r.birth_date).filter(Boolean).map(x => new Date(x)).sort((a, b) => a - b);
    if (births.length > 0) {
      let count = 0;
      for (const bd of births) { if (d > bd) count++; else break; }
      return done(null, count + 1);
    }

    // Check admissions via patients table join (admissions uses user_id, not patient_id)
    const admSql = `
      SELECT COALESCE(a.delivered_at, a.admitted_at) AS pivot 
      FROM admissions a
      JOIN patients p ON (a.user_id = p.user_id AND p.user_id IS NOT NULL AND p.user_id > 0)
      WHERE p.id = ? 
      AND (a.delivered_at IS NOT NULL OR a.admitted_at IS NOT NULL) 
      ORDER BY COALESCE(a.delivered_at, a.admitted_at) ASC
    `;
    db.query(admSql, [patientId], (aErr, aRows) => {
      if (aErr) {
        console.warn('Admissions query warning (non-fatal):', aErr);
        // Continue to prenatal check even if admissions fails
        aRows = [];
      }

      const pivots = (aRows || []).map(r => r.pivot).filter(Boolean).map(x => new Date(x)).sort((a, b) => a - b);
      if (pivots.length > 0) {
        let count = 0;
        for (const pv of pivots) { if (d > pv) count++; else break; }
        return done(null, count + 1);
      }

      // Check prenatal_schedule for existing pregnancy cycles
      const prSql = `SELECT MAX(pregnancy_id) AS max_pid, MAX(COALESCE(scheduled_date, visit_date)) AS last_dt FROM prenatal_schedule WHERE patient_id = ?`;
      db.query(prSql, [patientId], (pErr, pRows) => {
        if (pErr) return done(pErr);
        const maxPid = pRows && pRows[0] && pRows[0].max_pid ? Number(pRows[0].max_pid) : null;
        const lastDt = pRows && pRows[0] && pRows[0].last_dt ? new Date(pRows[0].last_dt) : null;

        // If no previous prenatal visits, or last visit was more than 180 days ago, start new cycle
        if (!lastDt || Math.abs(d - lastDt) > 1000 * 60 * 60 * 24 * 180) {
          return done(null, (maxPid || 0) + 1);
        }
        return done(null, maxPid || 1);
      });
    });
  });
}

const addWalkInPrenatal = (req, res) => {
  const { patient_name, contact_number, visit_date, gestational_age, weight, blood_pressure, fundal_height, fetal_heart_rate, notes, next_visit_date, temperature_c, heart_rate, respiratory_rate } = req.body;

  if (!patient_name || !contact_number || !visit_date) {
    return res.status(400).json({ error: "Patient name, contact number, and visit date are required" });
  }

  // First, find the patient_id from the patients table (allow name with or without middle name)
  const findPatientSql = `
    SELECT id AS patient_id FROM patients 
    WHERE phone = ? AND (
      TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? OR
      TRIM(CONCAT_WS(' ', first_name, last_name)) = ?
    )
    LIMIT 1`;

  db.query(findPatientSql, [contact_number, patient_name, patient_name], (err, patientResults) => {
    if (err) {
      console.error('Error finding patient:', err);
      return res.status(500).json({ error: "Failed to find patient" });
    }

    // Compute visit_number and trimester from existing records and GA
    const computeAndInsert = (patientId) => {
      const countSql = `SELECT COUNT(*) AS cnt FROM prenatal_schedule WHERE patient_id = ?`;
      db.query(countSql, [patientId], (cntErr, cntRows) => {
        if (cntErr) {
          console.error('Error computing visit_number:', cntErr);
          return res.status(500).json({ error: "Failed to add prenatal visit" });
        }
        const visit_number = Number(cntRows?.[0]?.cnt || 0) + 1;
        const gaWeeks = parseInt(gestational_age, 10);
        const trimester = isNaN(gaWeeks) ? 1 : (gaWeeks <= 13 ? 1 : gaWeeks <= 27 ? 2 : 3);

        const cycleChoiceRaw = String(req.body.cycle_choice || '').toLowerCase();
        const resolvePid = (cb) => {
          if (cycleChoiceRaw === 'new' || cycleChoiceRaw === 'current') {
            const prMaxSql = 'SELECT MAX(pregnancy_id) AS max_pid FROM prenatal_schedule WHERE patient_id = ?';
            db.query(prMaxSql, [patientId], (mErr, mRows) => {
              if (mErr) return cb(mErr, null);
              const maxPid = (mRows && mRows[0] && mRows[0].max_pid) ? Number(mRows[0].max_pid) : null;
              if (cycleChoiceRaw === 'new') return cb(null, (maxPid || 0) + 1);
              return cb(null, maxPid || 1);
            });
          } else {
            resolvePregnancyIdForDateWalkin(patientId, visit_date, cb);
          }
        };
        resolvePid((pidErr, pid) => {
          if (pidErr) {
            console.error('Error resolving pregnancy ID:', pidErr);
            return res.status(500).json({ error: "Failed to resolve pregnancy cycle" });
          }

          const sql = `INSERT INTO prenatal_schedule 
            (patient_id, pregnancy_id, visit_number, trimester, scheduled_date, gestational_age, fundal_height_cm, fetal_heart_rate, blood_pressure, weight_kg, temperature_c, maternal_heart_rate, respiratory_rate, assessment, status, attended) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', TRUE)`;

          db.query(sql, [patientId, pid, visit_number, trimester, visit_date, gestational_age, fundal_height, fetal_heart_rate, blood_pressure, weight, temperature_c || null, heart_rate || null, respiratory_rate || null, notes], (insErr, result) => {
            if (insErr) {
              console.error('Error adding prenatal visit:', insErr);
              return res.status(500).json({ error: "Failed to add prenatal visit" });
            }
            if (isValidYYYYMMDD(next_visit_date)) {
              ensureDayAvailable(next_visit_date, () => {
                const svcSql = "SELECT duration FROM services WHERE name = ? OR category = 'prenatal_care' LIMIT 1";
                db.query(svcSql, ['Prenatal Care'], (sErr, sRows) => {
                  const duration = (sRows && sRows[0] && sRows[0].duration) ? Number(sRows[0].duration) : 30;
                  const requiredSlots = getRequiredSlotsForDuration(duration);
                  const bookedSql = `SELECT time_slot FROM booking WHERE date = ? AND request_status != 'declined' AND appointment_status != 'cancelled'`;
                  const blockedSql = `SELECT time_slot FROM slots WHERE date = ? AND status = 'not_available'`;
                  db.query(bookedSql, [next_visit_date], (bErr, bRows) => {
                    if (bErr) {
                      return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
                    }
                    db.query(blockedSql, [next_visit_date], (blErr, blRows) => {
                      if (blErr) {
                        return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
                      }
                      const bookedSet = new Set((bRows || []).map(r => r.time_slot));
                      const blockedSet = new Set((blRows || []).map(r => r.time_slot));
                      let startSlot = null;
                      for (const s of SLOT_SEQUENCE) {
                        const seq = getConsecutiveSlots(s, requiredSlots);
                        if (!seq) continue;
                        let ok = true;
                        for (const t of seq) {
                          if (bookedSet.has(t) || blockedSet.has(t)) { ok = false; break; }
                        }
                        if (ok) { startSlot = s; break; }
                      }
                      if (!startSlot) {
                        return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
                      }
                      const seq = getConsecutiveSlots(startSlot, requiredSlots);
                      const placeholders = new Array(requiredSlots).fill('?').join(',');
                      const conflictSql = 'SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (' + placeholders + ") AND request_status != 'declined' AND appointment_status != 'cancelled'";
                      db.query(conflictSql, [next_visit_date, ...seq], (cErr, cRes) => {
                        if ((cErr ? true : false) || ((cRes && cRes[0] && cRes[0].cnt) ? Number(cRes[0].cnt) > 0 : false)) {
                          return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
                        }
                        const insertBooking = "INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status) VALUES (0, ?, ?, ?, ?, ?, 'confirmed', 'ongoing')";
                        db.query(insertBooking, [patient_name, contact_number || null, 'Prenatal Checkup', next_visit_date, startSlot], (iErr, iRes) => {
                          if (iErr) {
                            return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
                          }
                          const linkParams = new URLSearchParams();
                          linkParams.set('service', 'Prenatal Checkup');
                          linkParams.set('follow_up_of_booking_id', String(iRes.insertId));
                          linkParams.set('follow_up_due_on', next_visit_date);
                          const link = '/booking?' + linkParams.toString();
                          return res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully', auto_scheduled_followup_booking_id: iRes.insertId, auto_booking_link: link });
                        });
                      });
                    });
                  });
                });
              });
            } else {
              res.status(201).json({ id: result.insertId, message: 'Prenatal visit added successfully' });
            }
          });
        });
      });
    };

    if (patientResults.length === 0) {
      // Auto-create a minimal patient record for walk-in if not found
      const tokens = String(patient_name).split(' ').filter(Boolean);
      const firstName = tokens[0] || '';
      const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
      const middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;

      const placeholderEmail = `walkin_${contact_number}@placeholder.local`;
      const createSql = `INSERT INTO patients (first_name, middle_name, last_name, phone, email, gender) VALUES (?, ?, ?, ?, ?, 'unspecified')`;

      db.query(createSql, [firstName, middleName, lastName, contact_number, placeholderEmail], (createErr, createRes) => {
        if (createErr) {
          console.error('Error creating patient for prenatal:', createErr);
          return res.status(500).json({ error: "Failed to create patient for prenatal visit" });
        }
        return computeAndInsert(createRes.insertId);
      });
      return; // prevent fall-through
    }

    // Patient found; proceed to insert prenatal
    const patient_id = patientResults[0].patient_id;
    computeAndInsert(patient_id);
  });
};

// Get prenatal visits for walk-in patient
const getWalkInPrenatal = (req, res) => {
  const { patient_name, contact_number } = req.query;

  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: "Patient name and contact number are required" });
  }

  const sql = `
    SELECT 
      ps.id,
      ps.pregnancy_id,
      ps.scheduled_date AS visit_date,
      ps.gestational_age,
      ps.weight_kg AS weight,
      ps.blood_pressure,
      ps.fundal_height_cm AS fundal_height,
      ps.fetal_heart_rate,
      ps.temperature_c,
      ps.maternal_heart_rate,
      ps.respiratory_rate,
      ps.assessment,
      ps.status
    FROM prenatal_schedule ps
    JOIN patients p ON ps.patient_id = p.id
    WHERE (TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = ? 
           OR TRIM(CONCAT_WS(' ', p.first_name, p.last_name)) = ?)
    AND p.phone = ?
    ORDER BY ps.scheduled_date DESC
  `;

  db.query(sql, [patient_name.trim(), patient_name.trim(), contact_number], (err, results) => {
    if (err) {
      console.error('Error fetching prenatal visits:', err);
      return res.status(500).json({ error: "Failed to fetch prenatal visits" });
    }
    res.json(results);
  });
};

// Add baby record for walk-in patient
const addWalkInBaby = (req, res) => {
  const { patient_name, contact_number, baby_name, birth_date, birth_time, gender, birth_weight, birth_length, head_circumference, apgar_score, delivery_type, complications, notes } = req.body;

  if (!patient_name || !contact_number || !birth_date) {
    return res.status(400).json({ error: "Patient name, contact number, and birth date are required" });
  }

  // First, find the patient_id from patients table (allow name with or without middle name)
  const findPatientSql = `
    SELECT id AS patient_id FROM patients 
    WHERE phone = ? AND (
      TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? OR
      TRIM(CONCAT_WS(' ', first_name, last_name)) = ?
    )
    LIMIT 1`;

  db.query(findPatientSql, [contact_number, patient_name, patient_name], (err, patientResults) => {
    if (err) {
      console.error('Error finding patient:', err);
      return res.status(500).json({ error: "Failed to find patient" });
    }

    if (patientResults.length === 0) {
      return res.status(404).json({ error: "Walk-in patient not found" });
    }

    const patient_id = patientResults[0].patient_id;

    const sql = `INSERT INTO babies 
      (mother_patient_id, first_name, birth_date, birth_time, gender, birth_weight_kg, birth_length_cm, head_circumference_cm, apgar_1min, complications) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [patient_id, baby_name, birth_date, birth_time, gender, birth_weight, birth_length, head_circumference, apgar_score, complications], (err, result) => {
      if (err) {
        console.error('Error adding baby record:', err);
        return res.status(500).json({ error: "Failed to add baby record" });
      }
      res.status(201).json({ id: result.insertId, message: 'Baby record added successfully' });
    });
  });
};

// Get baby records for walk-in patient
const getWalkInBabies = (req, res) => {
  const { patient_name, contact_number } = req.query;

  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: "Patient name and contact number are required" });
  }

  const sql = `
    SELECT b.* FROM babies b
    JOIN patients p ON b.mother_patient_id = p.id
    WHERE (TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = ? 
           OR TRIM(CONCAT_WS(' ', p.first_name, p.last_name)) = ?)
    AND p.phone = ?
    ORDER BY b.birth_date DESC
  `;

  db.query(sql, [patient_name.trim(), patient_name.trim(), contact_number], (err, results) => {
    if (err) {
      console.error('Error fetching baby records:', err);
      return res.status(500).json({ error: "Failed to fetch baby records" });
    }
    res.json(results);
  });
};

// Add lab result for walk-in patient
const addWalkInLabResult = (req, res) => {
  const {
    patient_name,
    contact_number,
    test_name,
    test_category,
    test_date,
    result_value,
    unit,
    reference_range,
    status,
    lab_name,
    // ordered_by is often a name string from UI; DB expects user id. Skip for now.
    notes
  } = req.body;

  if (!patient_name || !contact_number || !test_name || !test_date) {
    return res.status(400).json({ error: "Patient name, contact number, test name, and test date are required" });
  }

  // Normalize status values from UI to DB enum
  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Critical: 'critical',
      Pending: 'pending'
    };
    const lower = String(val).toLowerCase();
    // Accept already-lowercase variants too
    const lowerMap = {
      normal: 'completed',
      abnormal: 'abnormal',
      critical: 'critical',
      pending: 'pending'
    };
    return map[val] || lowerMap[lower] || lower;
  };

  const resolvedStatus = normalizeStatus(status);

  // First, find the patient_id from patients table (allow name with or without middle name)
  const findPatientSql = `
    SELECT id AS patient_id FROM patients 
    WHERE phone = ? AND (
      TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? OR
      TRIM(CONCAT_WS(' ', first_name, last_name)) = ?
    )
    LIMIT 1`;

  db.query(findPatientSql, [contact_number, patient_name, patient_name], (err, patientResults) => {
    if (err) {
      console.error('Error finding patient:', err);
      return res.status(500).json({ error: "Failed to find patient" });
    }

    if (patientResults.length === 0) {
      return res.status(404).json({ error: "Walk-in patient not found" });
    }

    const patient_id = patientResults[0].patient_id;

    // Insert only columns that exist in lab_results schema
    const sql = `INSERT INTO lab_results 
      (patient_id, test_type, test_category, test_date, result_value, unit, reference_range, status, lab_name, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      patient_id,
      test_name,
      test_category || 'other',
      test_date,
      result_value,
      unit,
      reference_range,
      resolvedStatus,
      lab_name,
      notes
    ];

    db.query(sql, params, (insertErr, result) => {
      if (insertErr) {
        console.error('Error adding lab result:', insertErr);
        return res.status(500).json({ error: "Failed to add lab result" });
      }
      res.status(201).json({ id: result.insertId, message: 'Lab result added successfully' });
    });
  });
};

// Get lab results for walk-in patient
const getWalkInLabResults = (req, res) => {
  const { patient_name, contact_number } = req.query;

  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: "Patient name and contact number are required" });
  }

  const sql = `
    SELECT lr.* FROM lab_results lr
    JOIN patients p ON lr.patient_id = p.id
    WHERE (TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = ? 
           OR TRIM(CONCAT_WS(' ', p.first_name, p.last_name)) = ?)
    AND p.phone = ?
    ORDER BY lr.test_date DESC
  `;

  db.query(sql, [patient_name.trim(), patient_name.trim(), contact_number], (err, results) => {
    if (err) {
      console.error('Error fetching lab results:', err);
      return res.status(500).json({ error: "Failed to fetch lab results" });
    }
    res.json(results);
  });
};

// Add postpartum assessment for walk-in patient
const addWalkInPostpartum = (req, res) => {
  const { patient_name, contact_number, assessment_date, days_postpartum, bleeding_status, pain_level, breastfeeding_status, mood_assessment, temperature, blood_pressure, fundal_height, lochia_color, episiotomy_healing, contraception_discussed, follow_up_needed, notes, iron_supplement_date, vitamin_a_date, foul_smell_discharge, family_planning_method } = req.body;

  if (!patient_name || !contact_number || !assessment_date || !days_postpartum) {
    return res.status(400).json({ error: "Patient name, contact number, assessment date, and days postpartum are required" });
  }

  // First, find the patient_id from patients table
  const findPatientSql = `SELECT id as patient_id FROM patients WHERE TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? AND phone = ? LIMIT 1`;

  db.query(findPatientSql, [patient_name, contact_number], (err, patientResults) => {
    if (err) {
      console.error('Error finding patient:', err);
      return res.status(500).json({ error: "Failed to find patient" });
    }

    if (patientResults.length === 0) {
      return res.status(404).json({ error: "Walk-in patient not found" });
    }

    const patient_id = patientResults[0].patient_id;

    const sql = `INSERT INTO postpartum_care 
      (patient_id, pregnancy_id, day_postpartum, assessment_date, breastfeeding_status, mood_assessment, temperature, blood_pressure, fundal_height, lochia_type, perineum_condition, notes, iron_supplement_date, vitamin_a_date, foul_smell_discharge, family_planning_method, fever, vaginal_bleeding) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [patient_id, (req.body.pregnancy_id || null), days_postpartum, assessment_date, breastfeeding_status, mood_assessment, temperature, blood_pressure, fundal_height, lochia_color, episiotomy_healing, notes, iron_supplement_date || null, vitamin_a_date || null, foul_smell_discharge ? 1 : 0, family_planning_method || null, (req.body.fever ? 1 : 0), (req.body.vaginal_bleeding ? 1 : 0)], (err, result) => {
      if (err) {
        console.error('Error adding postpartum assessment:', err);
        return res.status(500).json({ error: "Failed to add postpartum assessment" });
      }
      res.status(201).json({ id: result.insertId, message: 'Postpartum assessment added successfully' });
    });
  });
};

// Get postpartum assessments for walk-in patient
const getWalkInPostpartum = (req, res) => {
  const { patient_name, contact_number } = req.query;

  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: "Patient name and contact number are required" });
  }

  const sql = `
    SELECT pc.* FROM postpartum_care pc
    JOIN patients p ON pc.patient_id = p.id
    WHERE (TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = ? 
           OR TRIM(CONCAT_WS(' ', p.first_name, p.last_name)) = ?)
    AND p.phone = ?
    ORDER BY pc.assessment_date DESC
  `;

  db.query(sql, [patient_name.trim(), patient_name.trim(), contact_number], (err, results) => {
    if (err) {
      console.error('Error fetching postpartum assessments:', err);
      return res.status(500).json({ error: "Failed to fetch postpartum assessments" });
    }
    res.json(results);
  });
};

// Add family planning record for walk-in patient
const addWalkInFamilyPlanning = (req, res) => {
  const {
    patient_name, contact_number, consultation_date, method_chosen,
    method_started_date, method_category, counseling_done, side_effects,
    follow_up_date, notes, counseled_by
  } = req.body;

  if (!patient_name || !contact_number || !consultation_date) {
    return res.status(400).json({ error: "Patient name, contact number, and consultation date are required" });
  }

  // Convert empty counseled_by to null for database
  const counselorValue = counseled_by && counseled_by.trim() !== '' ? counseled_by : null;

  // First, find the patient_id from the patients table (allow name with or without middle name)
  const findPatientSql = `
    SELECT id AS patient_id FROM patients 
    WHERE phone = ? AND (
      TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? OR
      TRIM(CONCAT_WS(' ', first_name, last_name)) = ?
    )
    LIMIT 1`;

  db.query(findPatientSql, [contact_number, patient_name, patient_name], (err, patientResult) => {
    if (err) {
      console.error('Error finding patient:', err);
      return res.status(500).json({ error: "Failed to find patient" });
    }

    if (patientResult.length === 0) {
      return res.status(404).json({ error: "Walk-in patient not found" });
    }

    const patient_id = patientResult[0].patient_id;

    const sql = `INSERT INTO family_planning 
      (patient_id, consultation_date, method_chosen, method_started_date, method_category, 
       counseling_done, side_effects, follow_up_date, notes, counseled_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [patient_id, consultation_date, method_chosen, method_started_date,
      method_category, counseling_done, side_effects, follow_up_date, notes, counselorValue];

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error adding family planning record:', err);
        return res.status(500).json({ error: "Failed to add family planning record" });
      }
      if (follow_up_date) {
        return ensureDayAvailable(follow_up_date, () => {
          res.status(201).json({ id: result.insertId, message: 'Family planning record added successfully' });
        });
      }
      res.status(201).json({ id: result.insertId, message: 'Family planning record added successfully' });
    });
  });
};

// Get family planning records for walk-in patient
const getWalkInFamilyPlanning = (req, res) => {
  const { patient_name, contact_number } = req.query;

  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: "Patient name and contact number are required" });
  }

  const sql = `
    SELECT fp.* FROM family_planning fp
    JOIN patients p ON fp.patient_id = p.id
    WHERE (TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) = ? 
           OR TRIM(CONCAT_WS(' ', p.first_name, p.last_name)) = ?)
    AND p.phone = ?
    ORDER BY fp.consultation_date DESC
  `;

  db.query(sql, [patient_name.trim(), patient_name.trim(), contact_number], (err, results) => {
    if (err) {
      console.error('Error fetching family planning records:', err);
      return res.status(500).json({ error: "Failed to fetch family planning records" });
    }
    res.json(results);
  });
};

// UPDATE controller functions for walk-in patient data

// Update prenatal visit
const updateWalkInPrenatal = (req, res) => {
  const { id } = req.params;
  const {
    visit_date,
    gestational_age,
    weight,
    blood_pressure,
    fundal_height,
    fetal_heart_rate,
    notes,
    temperature_c,
    heart_rate,
    respiratory_rate
  } = req.body;

  const sql = `
    UPDATE prenatal_schedule 
    SET scheduled_date = ?, gestational_age = ?, weight_kg = ?, blood_pressure = ?, 
        fundal_height_cm = ?, fetal_heart_rate = ?, temperature_c = ?, maternal_heart_rate = ?, respiratory_rate = ?, notes = ?
    WHERE id = ?
  `;

  db.query(sql, [visit_date, gestational_age, weight, blood_pressure, fundal_height, fetal_heart_rate, temperature_c || null, heart_rate || null, respiratory_rate || null, notes, id], (err, result) => {
    if (err) {
      console.error('Error updating prenatal visit:', err);
      return res.status(500).json({ error: "Failed to update prenatal visit" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Prenatal visit not found" });
    }

    res.json({ message: 'Prenatal visit updated successfully' });
  });
};

// Update baby record
const updateWalkInBaby = (req, res) => {
  const { id } = req.params;
  const {
    baby_name,
    birth_date,
    birth_weight,
    birth_length,
    gender,
    delivery_type,
    complications,
    notes
  } = req.body;

  const sql = `
    UPDATE babies 
    SET baby_name = ?, birth_date = ?, birth_weight = ?, birth_length = ?, 
        gender = ?, delivery_type = ?, complications = ?, notes = ?
    WHERE id = ?
  `;

  db.query(sql, [baby_name, birth_date, birth_weight, birth_length, gender, delivery_type, complications, notes, id], (err, result) => {
    if (err) {
      console.error('Error updating baby record:', err);
      return res.status(500).json({ error: "Failed to update baby record" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Baby record not found" });
    }

    res.json({ message: 'Baby record updated successfully' });
  });
};

// Update lab result
const updateWalkInLabResult = (req, res) => {
  const { id } = req.params;
  const {
    test_type,
    test_date,
    result_value,
    reference_range,
    status,
    notes
  } = req.body;

  // Normalize status values from UI to DB enum
  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Critical: 'critical',
      Pending: 'pending'
    };
    const lower = String(val).toLowerCase();
    const lowerMap = {
      normal: 'completed',
      abnormal: 'abnormal',
      critical: 'critical',
      pending: 'pending'
    };
    return map[val] || lowerMap[lower] || lower;
  };

  const resolvedStatus = normalizeStatus(status);

  const sql = `
    UPDATE lab_results 
    SET test_type = ?, test_date = ?, result_value = ?, reference_range = ?, 
        status = ?, notes = ?
    WHERE id = ?
  `;

  db.query(sql, [test_type, test_date, result_value, reference_range, resolvedStatus, notes, id], (err, result) => {
    if (err) {
      console.error('Error updating lab result:', err);
      return res.status(500).json({ error: "Failed to update lab result" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Lab result not found" });
    }

    res.json({ message: 'Lab result updated successfully' });
  });
};

// Update postpartum assessment
const updateWalkInPostpartum = (req, res) => {
  const { id } = req.params;
  const {
    assessment_date,
    physical_condition,
    mental_health,
    breastfeeding_status,
    contraception_discussed,
    follow_up_needed,
    notes
  } = req.body;

  const sql = `
    UPDATE postpartum_care 
    SET assessment_date = ?, physical_condition = ?, mental_health = ?, 
        breastfeeding_status = ?, contraception_discussed = ?, follow_up_needed = ?, notes = ?
    WHERE id = ?
  `;

  db.query(sql, [assessment_date, physical_condition, mental_health, breastfeeding_status, contraception_discussed, follow_up_needed, notes, id], (err, result) => {
    if (err) {
      console.error('Error updating postpartum assessment:', err);
      return res.status(500).json({ error: "Failed to update postpartum assessment" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Postpartum assessment not found" });
    }

    res.json({ message: 'Postpartum assessment updated successfully' });
  });
};

// Update family planning record
const updateWalkInFamilyPlanning = (req, res) => {
  const { id } = req.params;
  const {
    consultation_date,
    method_chosen,
    method_started_date,
    method_category,
    counseling_done,
    side_effects,
    follow_up_date,
    notes,
    counseled_by
  } = req.body;

  // Convert empty counseled_by to null for database
  const counselorValue = counseled_by && counseled_by.trim() !== '' ? counseled_by : null;

  const sql = `
    UPDATE family_planning 
    SET consultation_date = ?, method_chosen = ?, method_started_date = ?, 
        method_category = ?, counseling_done = ?, side_effects = ?, 
        follow_up_date = ?, notes = ?, counseled_by = ?
    WHERE id = ?
  `;

  db.query(sql, [consultation_date, method_chosen, method_started_date, method_category, counseling_done, side_effects, follow_up_date, notes, counselorValue, id], (err, result) => {
    if (err) {
      console.error('Error updating family planning record:', err);
      return res.status(500).json({ error: "Failed to update family planning record" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Family planning record not found" });
    }

    if (follow_up_date) {
      return ensureDayAvailable(follow_up_date, () => {
        res.json({ message: 'Family planning record updated successfully' });
      });
    }
    res.json({ message: 'Family planning record updated successfully' });
  });
};

// DELETE controller functions for walk-in patient data

// Delete prenatal visit
const deleteWalkInPrenatal = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM prenatal_schedule WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting prenatal visit:', err);
      return res.status(500).json({ error: "Failed to delete prenatal visit" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Prenatal visit not found" });
    }

    res.json({ message: 'Prenatal visit deleted successfully' });
  });
};

// Delete baby record
const deleteWalkInBaby = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM babies WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting baby record:', err);
      return res.status(500).json({ error: "Failed to delete baby record" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Baby record not found" });
    }

    res.json({ message: 'Baby record deleted successfully' });
  });
};

// Delete lab result
const deleteWalkInLabResult = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM lab_results WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting lab result:', err);
      return res.status(500).json({ error: "Failed to delete lab result" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Lab result not found" });
    }

    res.json({ message: 'Lab result deleted successfully' });
  });
};

// Delete postpartum assessment
const deleteWalkInPostpartum = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM postpartum_care WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting postpartum assessment:', err);
      return res.status(500).json({ error: "Failed to delete postpartum assessment" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Postpartum assessment not found" });
    }

    res.json({ message: 'Postpartum assessment deleted successfully' });
  });
};

// Delete family planning record
const deleteWalkInFamilyPlanning = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM family_planning WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting family planning record:', err);
      return res.status(500).json({ error: "Failed to delete family planning record" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Family planning record not found" });
    }

    res.json({ message: 'Family planning record deleted successfully' });
  });
};

// Update walk-in patient information
const updateWalkInPatient = (req, res) => {
  const { patient_id } = req.params; // This will be the patient identifier (name_contact)
  const {
    first_name,
    middle_name,
    last_name,
    phone,
    email,
    age,
    gender,
    blood_type,
    address,
    civil_status,
    religion,
    occupation,
    place_of_birth,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    allergies,
    notes,
    lmp,
    edd,
    gravida,
    para,
    partner_name,
    partner_age,
    partner_occupation,
    partner_religion
  } = req.body;

  // Decode the patient_id which is in format "name_contact"
  const decodedPatientId = decodeURIComponent(patient_id);
  const [patientName, contactNumber] = decodedPatientId.split('_');

  if (!patientName || !contactNumber) {
    return res.status(400).json({ error: "Invalid patient identifier" });
  }

  // Find the patient in the database
  const findPatientSql = `
    SELECT id FROM patients 
    WHERE TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ?
      AND phone = ?
    LIMIT 1`;

  db.query(findPatientSql, [patientName, contactNumber], (findErr, rows) => {
    if (findErr) {
      console.error('Error finding patient:', findErr);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientDbId = rows[0].id;

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      params.push(first_name);
    }
    if (middle_name !== undefined) {
      updateFields.push('middle_name = ?');
      params.push(middle_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      params.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (age !== undefined) {
      updateFields.push('age = ?');
      params.push(age);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      params.push(gender);
    }
    if (blood_type !== undefined) {
      updateFields.push('blood_type = ?');
      params.push(blood_type);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      params.push(address);
    }
    if (civil_status !== undefined) {
      updateFields.push('marital_status = ?');
      params.push(civil_status || null);
    }
    if (religion !== undefined) {
      updateFields.push('religion = ?');
      params.push(religion || null);
    }
    if (occupation !== undefined) {
      updateFields.push('occupation = ?');
      params.push(occupation || null);
    }
    if (partner_name !== undefined) {
      updateFields.push('partner_name = ?');
      params.push(partner_name || null);
    }
    if (partner_age !== undefined) {
      updateFields.push('partner_age = ?');
      params.push(partner_age || null);
    }
    if (partner_occupation !== undefined) {
      updateFields.push('partner_occupation = ?');
      params.push(partner_occupation || null);
    }
    if (partner_religion !== undefined) {
      updateFields.push('partner_religion = ?');
      params.push(partner_religion || null);
    }
    if (place_of_birth !== undefined) {
      updateFields.push('place_of_birth = ?');
      params.push(place_of_birth || null);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      params.push(date_of_birth || null);
    }
    if (emergency_contact_name !== undefined) {
      updateFields.push('emergency_contact_name = ?');
      params.push(emergency_contact_name);
    }
    if (emergency_contact_phone !== undefined) {
      updateFields.push('emergency_contact_phone = ?');
      params.push(emergency_contact_phone);
    }
    if (emergency_contact_relationship !== undefined) {
      updateFields.push('emergency_contact_relationship = ?');
      params.push(emergency_contact_relationship);
    }
    if (allergies !== undefined) {
      updateFields.push('allergies = ?');
      params.push(allergies);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }
    if (lmp !== undefined) {
      updateFields.push('lmp = ?');
      params.push(lmp || null);
    }
    if (edd !== undefined) {
      updateFields.push('edd = ?');
      params.push(edd || null);
    }
    if (gravida !== undefined) {
      updateFields.push('gravida = ?');
      params.push(gravida || null);
    }
    if (para !== undefined) {
      updateFields.push('para = ?');
      params.push(para || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(patientDbId);

    const updateSql = `UPDATE patients SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(updateSql, params, (updateErr, result) => {
      if (updateErr) {
        console.error('Error updating patient:', updateErr);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json({ message: 'Patient information updated successfully' });
    });
  });
};

// Get walk-in patient profile by name and contact
const getWalkInPatientProfile = (req, res) => {
  const { patient_name, contact_number } = req.query;
  if (!patient_name || !contact_number) {
    return res.status(400).json({ error: 'patient_name and contact_number are required' });
  }
  const sql = `
    SELECT * FROM patients 
    WHERE phone = ? AND (
      TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) = ? OR
      TRIM(CONCAT_WS(' ', first_name, last_name)) = ?
    )
    LIMIT 1`;
  db.query(sql, [contact_number, patient_name, patient_name], (err, rows) => {
    if (err) {
      console.error('Error fetching walk-in patient profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(rows[0]);
  });
};

// Update registered patient information
const updateRegisteredPatient = (req, res) => {
  const { id } = req.params; // Patient ID from the database
  const {
    first_name,
    middle_name,
    last_name,
    email,
    phone,
    age,
    gender,
    blood_type,
    address,
    civil_status,
    religion,
    occupation,
    place_of_birth,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    allergies,
    notes,
    lmp,
    edd,
    gravida,
    para,
    partner_name,
    partner_age,
    partner_occupation,
    partner_religion
  } = req.body;

  // Build dynamic update query
  const updateFields = [];
  const params = [];

  if (first_name !== undefined) {
    updateFields.push('first_name = ?');
    params.push(first_name);
  }
  if (middle_name !== undefined) {
    updateFields.push('middle_name = ?');
    params.push(middle_name);
  }
  if (last_name !== undefined) {
    updateFields.push('last_name = ?');
    params.push(last_name);
  }
  if (email !== undefined) {
    updateFields.push('email = ?');
    params.push(email);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    params.push(phone);
  }
  if (age !== undefined) {
    updateFields.push('age = ?');
    params.push(age);
  }
  if (gender !== undefined) {
    updateFields.push('gender = ?');
    params.push(gender);
  }
  if (blood_type !== undefined) {
    updateFields.push('blood_type = ?');
    params.push(blood_type);
  }
  if (address !== undefined) {
    updateFields.push('address = ?');
    params.push(address);
  }
  if (civil_status !== undefined) {
    updateFields.push('marital_status = ?');
    params.push(civil_status || null);
  }
  if (religion !== undefined) {
    updateFields.push('religion = ?');
    params.push(religion || null);
  }
  if (occupation !== undefined) {
    updateFields.push('occupation = ?');
    params.push(occupation || null);
  }
  if (place_of_birth !== undefined) {
    updateFields.push('place_of_birth = ?');
    params.push(place_of_birth || null);
  }
  if (date_of_birth !== undefined) {
    updateFields.push('date_of_birth = ?');
    params.push(date_of_birth || null);
  }
  if (emergency_contact_name !== undefined) {
    updateFields.push('emergency_contact_name = ?');
    params.push(emergency_contact_name);
  }
  if (emergency_contact_phone !== undefined) {
    updateFields.push('emergency_contact_phone = ?');
    params.push(emergency_contact_phone);
  }
  if (emergency_contact_relationship !== undefined) {
    updateFields.push('emergency_contact_relationship = ?');
    params.push(emergency_contact_relationship);
  }
  if (allergies !== undefined) {
    updateFields.push('allergies = ?');
    params.push(allergies);
  }
  if (notes !== undefined) {
    updateFields.push('notes = ?');
    params.push(notes);
  }
  if (lmp !== undefined) {
    updateFields.push('last_menstrual_period = ?');
    params.push(lmp || null);
  }
  if (edd !== undefined) {
    updateFields.push('expected_delivery_date = ?');
    params.push(edd || null);
  }
  if (gravida !== undefined) {
    updateFields.push('gravida = ?');
    params.push(gravida || null);
  }
  if (para !== undefined) {
    updateFields.push('para = ?');
    params.push(para || null);
  }
  if (partner_name !== undefined) {
    updateFields.push('partner_name = ?');
    params.push(partner_name || null);
  }
  if (partner_age !== undefined) {
    updateFields.push('partner_age = ?');
    params.push(partner_age || null);
  }
  if (partner_occupation !== undefined) {
    updateFields.push('partner_occupation = ?');
    params.push(partner_occupation || null);
  }
  if (partner_religion !== undefined) {
    updateFields.push('partner_religion = ?');
    params.push(partner_religion || null);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  // Add updated_at timestamp
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const updateSql = `UPDATE patients SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(updateSql, params, (updateErr, result) => {
    if (updateErr) {
      console.error('Error updating registered patient:', updateErr);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient information updated successfully' });
  });
};

// ============================================
// WALK-IN SCREENING MANAGEMENT
// ============================================
const addWalkInScreening = (req, res) => {
  const {
    patient_name, contact_number, test_type, date_performed,
    gestational_age, birth_weight_kg, screening_method, result, interpretation,
    recommendations, follow_up_required, follow_up_date, status, healthcare_provider,
    reviewed_by, lab_name, notes
  } = req.body;

  // Normalize status values from UI to DB enum
  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Pending: 'pending',
      Inconclusive: 'requires_follow_up',
      requires_followup: 'requires_follow_up'
    };
    const lower = String(val).toLowerCase();
    const lowerMap = {
      normal: 'completed',
      abnormal: 'abnormal',
      pending: 'pending',
      inconclusive: 'requires_follow_up',
      requires_followup: 'requires_follow_up',
      requires_follow_up: 'requires_follow_up'
    };
    return map[val] || lowerMap[lower] || lower;
  };

  const resolvedStatus = normalizeStatus(status);
  const reviewedBy = reviewed_by ? (parseInt(reviewed_by, 10) || null) : null;
  const gAge = gestational_age ?? null;
  const birthWeight = birth_weight_kg ?? null;
  const method = screening_method ?? null;
  const resultsVal = result ?? null;
  const interp = interpretation ?? null;
  const recom = recommendations ?? null;
  const followUpRequired = !!follow_up_required;
  const followUpDate = follow_up_date ?? null;
  const screenedBy = healthcare_provider ?? null;
  const labName = lab_name ?? null;
  const notesVal = notes ?? null;

  const sql = `INSERT INTO screenings 
    (patient_id, patient_name, contact_number, screening_type, screening_date,
     gestational_age, birth_weight_kg, screening_method, results, interpretation,
     recommendations, follow_up_required, follow_up_date, status, screened_by,
     reviewed_by, lab_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    null, // patient_id is NULL for walk-in patients
    patient_name, contact_number, test_type, date_performed,
    gAge, birthWeight, method, resultsVal, interp,
    recom, followUpRequired, followUpDate, resolvedStatus,
    screenedBy, reviewedBy, labName, notesVal
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding walk-in screening:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const needsFollowUpAvailability = !!followUpRequired && !!followUpDate;
    if (needsFollowUpAvailability) {
      return ensureDayAvailable(followUpDate, () => {
        res.json({ message: 'Walk-in screening added successfully', id: result.insertId });
      });
    }
    res.json({ message: 'Walk-in screening added successfully', id: result.insertId });
  });
};

const getWalkInScreenings = (req, res) => {
  const { patient_name, contact_number } = req.query;

  let sql = `SELECT * FROM screenings WHERE patient_id IS NULL`;
  let params = [];

  if (patient_name) {
    sql += ` AND patient_name = ?`;
    params.push(patient_name.trim());
  }

  if (contact_number) {
    sql += ` AND contact_number = ?`;
    params.push(contact_number.trim());
  }

  sql += ` ORDER BY screening_date DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching walk-in screenings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Update a walk-in screening record
const updateWalkInScreening = (req, res) => {
  const { id } = req.params;
  const {
    test_type,
    date_performed,
    result,
    status,
    healthcare_provider,
    notes,
    follow_up_required,
    follow_up_date
  } = req.body;

  // Normalize status to align with DB enum values used in add
  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Pending: 'pending',
      Inconclusive: 'requires_follow_up',
      requires_followup: 'requires_follow_up'
    };
    const lower = String(val).toLowerCase();
    const lowerMap = {
      normal: 'completed',
      abnormal: 'abnormal',
      pending: 'pending',
      inconclusive: 'requires_follow_up',
      requires_followup: 'requires_follow_up',
      requires_follow_up: 'requires_follow_up'
    };
    return map[val] || lowerMap[lower] || lower;
  };

  const sql = `UPDATE screenings SET 
      screening_type = ?,
      screening_date = ?,
      results = ?,
      status = ?,
      screened_by = ?,
      notes = ?,
      follow_up_required = ?,
      follow_up_date = ?
    WHERE id = ? AND patient_id IS NULL`;

  const values = [
    test_type ?? null,
    date_performed ?? null,
    result ?? null,
    normalizeStatus(status),
    healthcare_provider ?? null,
    notes ?? null,
    !!follow_up_required,
    follow_up_date ?? null,
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating walk-in screening:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in screening not found' });
    }
    const needsFollowUpAvailability = !!follow_up_required && !!follow_up_date;
    if (needsFollowUpAvailability) {
      return ensureDayAvailable(follow_up_date, () => {
        res.json({ message: 'Walk-in screening updated successfully' });
      });
    }
    res.json({ message: 'Walk-in screening updated successfully' });
  });
};

const deleteWalkInScreening = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM screenings WHERE id = ? AND patient_id IS NULL`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting walk-in screening:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in screening not found' });
    }
    res.json({ message: 'Walk-in screening deleted successfully' });
  });
};

// ============================================
// WALK-IN PROCEDURE MANAGEMENT
// ============================================
const addWalkInProcedure = (req, res) => {
  const {
    patient_name, contact_number, procedure_type, procedure_category,
    date_performed, procedure_time, duration_minutes, anesthesia_type, surgeon,
    assistant, location, indication, description, complications, outcome,
    post_op_instructions, follow_up_required, next_appointment, status, priority,
    cost, insurance_covered, notes
  } = req.body;

  const sql = `INSERT INTO procedures 
    (patient_id, patient_name, contact_number, procedure_name, procedure_category,
     procedure_date, procedure_time, duration_minutes, anesthesia_type, surgeon,
     assistant, location, indication, description, complications, outcome,
     post_op_instructions, follow_up_required, follow_up_date, status, priority,
     cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    null, // patient_id is NULL for walk-in patients
    patient_name, contact_number, procedure_type, procedure_category,
    date_performed, procedure_time, duration_minutes, anesthesia_type, surgeon,
    assistant, location, indication, description, complications, outcome,
    post_op_instructions, follow_up_required || false, next_appointment,
    status || 'scheduled', priority || 'routine', cost, notes
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding walk-in procedure:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (follow_up_required && next_appointment) {
      return ensureDayAvailable(next_appointment, () => {
        res.json({ message: 'Walk-in procedure added successfully', id: result.insertId });
      });
    }
    res.json({ message: 'Walk-in procedure added successfully', id: result.insertId });
  });
};

const getWalkInProcedures = (req, res) => {
  const { patient_name, contact_number } = req.query;

  let sql = `SELECT * FROM procedures WHERE patient_id IS NULL`;
  let params = [];

  if (patient_name) {
    sql += ` AND patient_name = ?`;
    params.push(patient_name.trim());
  }

  if (contact_number) {
    sql += ` AND contact_number = ?`;
    params.push(contact_number.trim());
  }

  sql += ` ORDER BY procedure_date DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching walk-in procedures:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteWalkInProcedure = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM procedures WHERE id = ? AND patient_id IS NULL`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting walk-in procedure:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in procedure not found' });
    }
    res.json({ message: 'Walk-in procedure deleted successfully' });
  });
};

// Update walk-in procedure
const updateWalkInProcedure = (req, res) => {
  const { id } = req.params;
  const {
    procedure_type,
    procedure_category,
    date_performed,
    procedure_time,
    duration_minutes,
    anesthesia_type,
    surgeon,
    assistant,
    location,
    indication,
    description,
    complications,
    outcome,
    post_op_instructions,
    follow_up_required,
    next_appointment,
    status,
    priority,
    cost,
    notes,
    // In some UIs, provider is captured as healthcare_provider; map to surgeon
    healthcare_provider
  } = req.body;

  const sql = `
    UPDATE procedures
    SET procedure_name = ?,
        procedure_category = ?,
        procedure_date = ?,
        procedure_time = ?,
        duration_minutes = ?,
        anesthesia_type = ?,
        surgeon = ?,
        assistant = ?,
        location = ?,
        indication = ?,
        description = ?,
        complications = ?,
        outcome = ?,
        post_op_instructions = ?,
        follow_up_required = ?,
        follow_up_date = ?,
        status = ?,
        priority = ?,
        cost = ?,
        notes = ?
    WHERE id = ?
  `;

  const params = [
    procedure_type,
    procedure_category,
    date_performed,
    procedure_time,
    duration_minutes,
    anesthesia_type,
    surgeon !== undefined ? surgeon : healthcare_provider,
    assistant,
    location,
    indication,
    description,
    complications,
    outcome,
    post_op_instructions,
    follow_up_required || false,
    next_appointment,
    status,
    priority,
    cost,
    notes,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating walk-in procedure:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in procedure not found' });
    }
    if (follow_up_required && next_appointment) {
      return ensureDayAvailable(next_appointment, () => {
        res.json({ message: 'Walk-in procedure updated successfully' });
      });
    }
    res.json({ message: 'Walk-in procedure updated successfully' });
  });
};

// ============================================
// WALK-IN IMMUNIZATION MANAGEMENT
// ============================================
const addWalkInImmunization = (req, res) => {
  const {
    patient_name, contact_number, vaccine_type, date_given,
    dose_number, injection_site, healthcare_provider, batch_number,
    manufacturer, next_due_date, notes, adverse_reactions
  } = req.body;

  const sql = `INSERT INTO immunizations 
    (patient_id, patient_name, contact_number, vaccine_type, date_given,
     dose_number, injection_site, healthcare_provider, batch_number,
     manufacturer, next_due_date, notes, adverse_reactions)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    patient_name, contact_number, vaccine_type, date_given,
    dose_number, injection_site, healthcare_provider, batch_number,
    manufacturer, next_due_date, notes, adverse_reactions
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding walk-in immunization:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (next_due_date) {
      return ensureDayAvailable(next_due_date, () => {
        res.json({ message: 'Walk-in immunization added successfully', id: result.insertId });
      });
    }
    res.json({ message: 'Walk-in immunization added successfully', id: result.insertId });
  });
};

const getWalkInImmunizations = (req, res) => {
  const { patient_name, contact_number } = req.query;

  let sql = `SELECT * FROM immunizations WHERE patient_id IS NULL`;
  let params = [];

  if (patient_name) {
    sql += ` AND patient_name = ?`;
    params.push(patient_name.trim());
  }

  if (contact_number) {
    sql += ` AND contact_number = ?`;
    params.push(contact_number.trim());
  }

  sql += ` ORDER BY date_given DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching walk-in immunizations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteWalkInImmunization = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM immunizations WHERE id = ? AND patient_id IS NULL`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting walk-in immunization:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in immunization not found' });
    }
    res.json({ message: 'Walk-in immunization deleted successfully' });
  });
};

// Update walk-in immunization
const updateWalkInImmunization = (req, res) => {
  const { id } = req.params;
  const {
    vaccine_type,
    date_given,
    dose_number,
    injection_site,
    healthcare_provider,
    batch_number,
    manufacturer,
    next_due_date,
    notes,
    adverse_reactions
  } = req.body;

  const sql = `
    UPDATE immunizations
    SET vaccine_type = ?,
        date_given = ?,
        dose_number = ?,
        injection_site = ?,
        healthcare_provider = ?,
        batch_number = ?,
        manufacturer = ?,
        next_due_date = ?,
        notes = ?,
        adverse_reactions = ?
    WHERE id = ? AND patient_id IS NULL
  `;

  const params = [
    vaccine_type,
    date_given,
    dose_number,
    injection_site,
    healthcare_provider,
    batch_number,
    manufacturer,
    next_due_date,
    notes,
    adverse_reactions,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating walk-in immunization:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Walk-in immunization not found' });
    }
    if (next_due_date) {
      return ensureDayAvailable(next_due_date, () => {
        res.json({ message: 'Walk-in immunization updated successfully' });
      });
    }
    res.json({ message: 'Walk-in immunization updated successfully' });
  });
};

// Delete appointment (for staff/admin - only for completed or cancelled appointments)
const deleteAppointment = (req, res) => {
  const { id } = req.params;
  const role = req.user?.role;

  if (!id) {
    return res.status(400).json({ error: 'Appointment ID is required' });
  }

  if (!['staff', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Only staff or admin can delete appointments' });
  }

  // First, check if the appointment exists and is completed or cancelled
  const checkSql = 'SELECT appointment_status FROM booking WHERE id = ?';

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const status = results[0].appointment_status;

    // Only allow deletion of completed or cancelled appointments
    if (status !== 'completed' && status !== 'cancelled') {
      return res.status(400).json({
        error: 'Only completed or cancelled appointments can be deleted'
      });
    }

    // Delete the appointment
    const deleteSql = 'DELETE FROM booking WHERE id = ?';

    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Also delete related slots if any
      const deleteSlotsSql = 'DELETE FROM slots WHERE booking_id = ?';
      db.query(deleteSlotsSql, [id], (slotErr) => {
        if (slotErr) {
          console.error('Error deleting slots:', slotErr);
          // Don't fail the main operation
        }

        res.json({ message: 'Appointment deleted successfully' });
      });
    });
  });
};

module.exports = {
  getSchedules,
  addNotAvailableSlot,
  deleteSlot,
  addHolidaySlot,
  setDayCapacity,
  getAllAppointments,
  updateRequestStatus,
  updateAppointmentStatus,
  getAppointmentsByDate,
  getBlockedSlotsByDate,
  updateAppointmentDetails,
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  createDoctorCredentials,
  getServices,
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  createStaffCredentials,
  addService,
  updateService,
  deleteService,
  searchPatients,
  getOnlinePatientsByService,
  createWalkIn,
  getPatientProfile,
  getAllPatients,
  createPatient,
  createPatientAccount,
  blockTimeSlot,
  unblockTimeSlot,
  addWalkInToQueue,
  checkInBooking,
  releaseNoShow,
  deleteAppointment,

  // Walk-in specific data management functions
  addWalkInPrenatal,
  getWalkInPrenatal,
  addWalkInBaby,
  getWalkInBabies,
  addWalkInLabResult,
  getWalkInLabResults,
  addWalkInPostpartum,
  getWalkInPostpartum,
  addWalkInFamilyPlanning,
  getWalkInFamilyPlanning,

  // UPDATE functions
  updateWalkInPrenatal,
  updateWalkInBaby,
  updateWalkInLabResult,
  updateWalkInPostpartum,
  updateWalkInFamilyPlanning,

  // DELETE functions
  deleteWalkInPrenatal,
  deleteWalkInBaby,
  deleteWalkInLabResult,
  deleteWalkInPostpartum,
  deleteWalkInFamilyPlanning,
  updateWalkInPatient,
  updateRegisteredPatient,

  // Walk-in Screenings
  addWalkInScreening,
  getWalkInScreenings,
  updateWalkInScreening,
  deleteWalkInScreening,

  // Walk-in Procedures
  addWalkInProcedure,
  getWalkInProcedures,
  deleteWalkInProcedure,
  updateWalkInProcedure,

  // Walk-in Immunizations
  addWalkInImmunization,
  getWalkInImmunizations,
  deleteWalkInImmunization,
  updateWalkInImmunization,
  getQueueStatus,
  getWalkInPatientProfile,
  updateUserRole,
};

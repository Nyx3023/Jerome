const db = require("../config/db");

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
  const base = 30; // current granularity
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.max(1, Math.ceil(durationMinutes / base));
}

// Ensure day is available in calendar
function ensureDayAvailable(date, callback = () => { }) {
  if (!date) return callback();
  const upsertCalendarSql = `
    INSERT INTO appointments (date, time, title, status)
    VALUES (?, '00:00:00', 'Available', 'available')
    ON DUPLICATE KEY UPDATE title = title, status = status
  `;
  db.query(upsertCalendarSql, [date], () => callback());
}

// Get all appointments for doctor view
// Only show appointments booked on OB Available dates (is_ob_booking = 1)
const getDoctorAppointments = (req, res) => {
  const sql = `
    SELECT 
      b.id,
      b.patient_name,
      b.date,
      b.time_slot,
      b.request_status,
      b.appointment_status,
      b.service_type,
      b.contact_number,
      b.user_id,
      b.follow_up_of_booking_id,
      b.follow_up_provider_type,
      b.is_ob_booking,
      b.ob_provider_type,
      p.id as patient_id,
      p.age,
      p.expected_delivery_date,
      p.last_menstrual_period,
      CASE WHEN mn.id IS NOT NULL AND mn.vital_signs IS NOT NULL AND mn.vital_signs <> '' THEN 1 ELSE 0 END AS has_vitals,
      b.created_at,
      b.cancel_reason,
      b.cancel_note,
      b.cancelled_at,
      b.cancelled_by,
      af.rating AS feedback_rating,
      af.comment AS feedback_comment
    FROM booking b
    LEFT JOIN patients p ON b.user_id = p.user_id
    LEFT JOIN medical_notes mn ON mn.booking_id = b.id
    LEFT JOIN appointment_feedback af ON af.booking_id = b.id
    WHERE (b.ob_provider_type = 'doctor' OR b.is_ob_booking = 1)
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

// Get appointments by date for doctor view
const getAppointmentsByDate = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date parameter is required' });
  const sql = `
    SELECT
      b.id,
      b.patient_name,
      b.date,
      b.time_slot,
      b.request_status,
      b.appointment_status,
      b.service_type,
      b.contact_number
    FROM booking b
    WHERE b.date = ? AND b.is_ob_booking = 1
      AND b.request_status != 'declined'
      AND b.appointment_status != 'cancelled'
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

// Update appointment status (doctor can mark as ongoing, completed, etc.)
const updateAppointmentStatus = (req, res) => {
  const { id, status, cancel_reason, cancel_note } = req.body;
  const role = req.user?.role;
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!['completed', 'cancelled'].includes(status)) {
    return res.status(403).json({ error: 'Doctors can only complete or cancel appointments' });
  }

  let sql, params;
  if (status === 'cancelled') {
    sql = `
      UPDATE booking 
      SET appointment_status = ?,
          cancel_reason = ?,
          cancel_note = ?,
          cancelled_by = 'doctor',
          cancelled_at = NOW()
      WHERE id = ?
    `;
    params = [status, cancel_reason || null, cancel_note || null, id];
  } else {
    sql = 'UPDATE booking SET appointment_status = ? WHERE id = ?';
    params = [status, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    // If appointment is completed, mark patient as consultation completed
    if (status === 'completed') {
      // Get appointment details to check if it's for a registered user
      const getAppointmentSql = 'SELECT user_id, date FROM booking WHERE id = ?';
      db.query(getAppointmentSql, [id], (getErr, appointmentResults) => {
        if (getErr) {
          console.error("Error fetching appointment details:", getErr);
          // Don't fail the main operation, just log the error
          return res.json({ message: "Appointment status updated successfully" });
        }

        if (appointmentResults.length > 0 && appointmentResults[0].user_id) {
          const userId = appointmentResults[0].user_id;
          const appointmentDate = appointmentResults[0].date;

          // Check if patient already has consultation_completed = TRUE
          const upsertSql = `
            INSERT INTO patients(user_id, first_name, middle_name, last_name, email, phone, gender)
            SELECT u.id, SUBSTRING_INDEX(u.email, '@', 1), NULL, '', u.email, '00000000000', 'female'
            FROM users u
            LEFT JOIN patients p ON p.user_id = u.id
            WHERE u.id = ? AND p.user_id IS NULL
          `;
          db.query(upsertSql, [userId], (upErr) => {
            if (upErr) {
              // continue
            }
            const checkPatientSql = 'SELECT consultation_completed FROM patients WHERE user_id = ?';
            db.query(checkPatientSql, [userId], (checkErr, patientResults) => {
              if (checkErr) {
                console.error("Error checking patient consultation status:", checkErr);
                return res.json({ message: "Appointment status updated successfully" });
              }

              // If patient exists and hasn't completed consultation yet, mark as completed
              if (patientResults.length > 0 && !patientResults[0].consultation_completed) {
                const updatePatientSql = `
                  UPDATE patients 
                  SET consultation_completed = TRUE,
                      first_consultation_date = ?
                  WHERE user_id = ?
                `;
                db.query(updatePatientSql, [appointmentDate, userId], (updateErr) => {
                  if (updateErr) {
                    console.error("Error updating patient consultation status:", updateErr);
                  }
                  res.json({
                    message: "Appointment completed and patient consultation status updated successfully"
                  });
                });
              } else {
                res.json({ message: "Appointment status updated successfully" });
              }
            });
          });
        } else {
          // Walk-in patient or no user_id, just return success
          res.json({ message: "Appointment status updated successfully" });
        }
      });
    } else {
      res.json({ message: "Appointment status updated successfully" });
    }
  });
};

// Get doctor dashboard stats
const getDoctorStats = (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const statsQueries = [
    // Today's appointments (OB only)
    `SELECT COUNT(*) as count FROM booking WHERE date = '${today}' AND request_status = 'confirmed' AND is_ob_booking = 1`,
    // Total appointments (OB only)
    `SELECT COUNT(*) as count FROM booking WHERE is_ob_booking = 1`,
    // Pending requests (OB only)
    `SELECT COUNT(*) as count FROM booking WHERE request_status = 'pending' AND is_ob_booking = 1`,
    // Completed appointments (OB only)
    `SELECT COUNT(*) as count FROM booking WHERE appointment_status = 'completed' AND is_ob_booking = 1`
  ];

  Promise.all(statsQueries.map(query => {
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }))
    .then(([todayAppointments, totalAppointments, pendingRequests, completedAppointments]) => {
      res.json({
        todayAppointments,
        totalAppointments,
        pendingRequests,
        completedAppointments
      });
    })
    .catch(err => {
      console.error("Database error:", err);
      res.status(500).json({ error: "Database error" });
    });
};

const getDoctorRecentActivity = (req, res) => {
  const qBookings = `
    SELECT
      id,
      patient_name,
      service_type,
      date,
      time_slot,
      request_status,
      appointment_status,
      COALESCE(updated_at, created_at) AS occurred_at
    FROM booking
    WHERE is_ob_booking = 1
    ORDER BY occurred_at DESC
    LIMIT 10
  `;
  const qAdmissions = `
    SELECT
      a.id,
      CASE WHEN a.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) ELSE a.patient_name END AS patient_name,
      a.room,
      a.admission_reason,
      a.status,
      COALESCE(a.updated_at, a.admitted_at) AS occurred_at
    FROM admissions a
    LEFT JOIN patients p ON a.user_id = p.user_id
    ORDER BY occurred_at DESC
    LIMIT 10
  `;
  db.query(qBookings, (err1, rows1) => {
    if (err1) {
      return res.status(500).json({ error: 'Database error' });
    }
    db.query(qAdmissions, (err2, rows2) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      const items1 = (rows1 || []).map(r => {
        let title = 'Appointment update';
        if (r.appointment_status === 'completed') title = 'Appointment completed';
        else if (r.appointment_status === 'cancelled') title = 'Appointment cancelled';
        else if (r.request_status === 'confirmed') title = 'Appointment confirmed';
        else if (r.request_status === 'pending') title = 'New appointment request';
        return {
          type: 'appointment',
          title,
          subtitle: `${r.patient_name || 'N/A'} · ${r.service_type || 'Service'} · ${r.date || ''} ${r.time_slot || ''}`.trim(),
          occurred_at: r.occurred_at
        };
      });
      const items2 = (rows2 || []).map(r => {
        let title = 'Admission update';
        if (r.status === 'admitted') title = 'Patient admitted';
        else if (r.status === 'delivered') title = 'Delivery recorded';
        else if (r.status === 'discharged') title = 'Patient discharged';
        return {
          type: 'admission',
          title,
          subtitle: `${r.patient_name || 'N/A'} · ${r.room || 'No room'} · ${r.admission_reason || ''}`.trim(),
          occurred_at: r.occurred_at
        };
      });
      const combined = [...items1, ...items2].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)).slice(0, 10);
      res.json(combined);
    });
  });
};

// Get active services for doctor view
const getServices = (req, res) => {
  console.log('Doctor fetching active services...'); // Debug log
  const sql = "SELECT * FROM services WHERE status = 'active' ORDER BY name";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log('Found services for doctor:', results); // Debug log
    res.json(results);
  });
};

// Get all patients for doctor view (including registered patients and walk-ins)
const getPatients = (req, res) => {
  console.log('Doctor fetching all patients...'); // Debug log

  // Show all patients; compute consultation_completed dynamically from bookings for robustness
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
          SELECT EXISTS(
            SELECT 1 FROM booking b 
            WHERE (
              p.user_id IS NOT NULL AND b.user_id = p.user_id AND b.appointment_status = 'completed'
            ) OR (
              p.user_id IS NULL 
              AND b.patient_name = TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name)) 
              AND b.contact_number = p.phone 
              AND b.appointment_status = 'completed'
            )
          )
        ) AS consultation_completed,
        (
          SELECT MIN(b.date) 
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
    console.log('Found patients for doctor:', results.length); // Debug log
    res.json(results);
  });
};

// Online patients by service (registered users with recent bookings)
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

// Schedule a follow-up appointment (doctor-initiated)
const scheduleFollowUp = (req, res) => {
  const { appointmentId, date, time_slot, service_type, follow_up_provider_type } = req.body;

  if (!appointmentId || !date || !time_slot) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Fetch original appointment to copy patient details
  const getOriginalSql = "SELECT * FROM booking WHERE id = ?";
  db.query(getOriginalSql, [appointmentId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Original appointment not found" });
    }

    const original = results[0];
    const userId = original.user_id || null; // supports walk-ins
    const patientName = original.patient_name;
    const contactNumber = original.contact_number;
    const followupService = service_type || original.service_type;

    // Determine required consecutive slots for follow-up service and check conflicts
    const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
    db.query(svcSql, [followupService], (svcErr, svcRows) => {
      if (svcErr) {
        console.error("Database error:", svcErr);
        return res.status(500).json({ error: "Database error" });
      }
      const duration = svcRows?.[0]?.duration || 30;
      const requiredSlots = getRequiredSlotsForDuration(Number(duration));
      const neededSlots = getConsecutiveSlots(time_slot, requiredSlots);
      if (!neededSlots) {
        return res.status(400).json({ error: "Not enough consecutive time slots from selected start" });
      }
      const placeholders = neededSlots.map(() => '?').join(',');
      const conflictSql = `
        SELECT COUNT(*) AS cnt FROM booking
        WHERE date = ? AND time_slot IN (${placeholders})
          AND request_status != 'declined'
          AND appointment_status != 'cancelled'
      `;
      db.query(conflictSql, [date, ...neededSlots], (confErr, confRes) => {
        if (confErr) {
          console.error("Database error:", confErr);
          return res.status(500).json({ error: "Database error" });
        }

        if ((confRes?.[0]?.cnt || 0) > 0) {
          return res.status(400).json({ error: "Selected time requires multiple consecutive slots that are not fully available." });
        }

        // Ensure the date is available in calendar before booking
        ensureDayAvailable(date, () => {
          // Insert follow-up as confirmed by doctor
          const insertSql = `
            INSERT INTO booking (
              user_id,
              patient_name,
              contact_number,
              service_type,
              date,
              time_slot,
              request_status,
              appointment_status,
              follow_up_provider_type
            ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, ?)
          `;

          const values = [
            userId,
            patientName,
            contactNumber,
            followupService,
            date,
            time_slot,
            follow_up_provider_type || 'doctor'
          ];

          db.query(insertSql, values, (insErr, result) => {
            if (insErr) {
              console.error("Database error:", insErr);
              return res.status(500).json({ error: "Database error" });
            }

            // Link the new booking back to the original and set follow-up due date
            const linkSql = `
              UPDATE booking 
              SET follow_up_of_booking_id = ?, follow_up_due_on = ?
              WHERE id = ?
            `;
            db.query(linkSql, [appointmentId, date, result.insertId], (linkErr) => {
              if (linkErr) {
                console.error('Error linking follow-up booking:', linkErr);
                // Continue even if linkage fails to avoid blocking the appointment
              }

              // Upsert slot as booked for the follow-up
              const updateSlotsQuery = `
                INSERT INTO slots (date, time_slot, status, booking_id)
                VALUES (?, ?, 'booked', ?)
                ON DUPLICATE KEY UPDATE
                  status = 'booked',
                  booking_id = VALUES(booking_id)
              `;

              const reserveSeq = (i) => {
                if (i >= neededSlots.length) {
                  return res.json({
                    message: "Follow-up appointment scheduled successfully",
                    appointmentId: result.insertId
                  });
                }
                db.query(updateSlotsQuery, [date, neededSlots[i], result.insertId], (slotErr) => {
                  if (slotErr) {
                    console.error("Error updating slots for follow-up:", slotErr);
                    // continue
                  }
                  reserveSeq(i + 1);
                });
              };
              reserveSeq(0);
            });
          });
        });
      });
    });
  });
};

// Get current doctor's profile
const getDoctorProfile = (req, res) => {
  const userId = req.user.id;

  // First, get the user's email from the users table
  const userQuery = "SELECT email FROM users WHERE id = ? AND role = 'doctor'";

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "Doctor user not found" });
    }

    const userEmail = userResults[0].email;

    // Now get the doctor's profile from the doctors table
    const doctorQuery = "SELECT * FROM doctors WHERE email = ?";

    db.query(doctorQuery, [userEmail], (err, doctorResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (doctorResults.length === 0) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      const doctor = doctorResults[0];

      // Format the response to match the frontend expectations
      const profile = {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        email: doctor.email,
        phone: doctor.phone || doctor.contact || "Not provided",
        schedule: doctor.schedule || "Not specified",
        experience: doctor.experience || "Not specified",
        education: doctor.education || "Not specified",
        about: doctor.about || "No description available"
      };

      res.json(profile);
    });
  });
};

// Update current doctor's profile
const updateDoctorProfile = (req, res) => {
  const userId = req.user.id;
  const { name, specialization, phone, schedule, experience, education, about, license_number } = req.body;

  // First, get the user's email from the users table
  const userQuery = "SELECT email FROM users WHERE id = ? AND role = 'doctor'";

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "Doctor user not found" });
    }

    const userEmail = userResults[0].email;

    // Update the doctor's profile in the doctors table
    const updateQuery = `
      UPDATE doctors 
      SET name = ?, specialization = ?, phone = ?, schedule = ?, experience = ?, education = ?, about = ?, license_number = ?
      WHERE email = ?
    `;

    db.query(updateQuery, [name, specialization, phone, schedule, experience, education, about, license_number || null, userEmail], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      res.json({ message: "Profile updated successfully" });
    });
  });
};

// Delete appointment (only for completed or cancelled appointments)
const deleteAppointment = (req, res) => {
  const { id } = req.params;
  const role = req.user?.role;

  if (!id) {
    return res.status(400).json({ error: 'Appointment ID is required' });
  }

  if (role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden: Only doctors can delete appointments' });
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
  getDoctorAppointments,
  getAppointmentsByDate,
  updateAppointmentStatus,
  getDoctorStats,
  getDoctorRecentActivity,
  getServices,
  getPatients,
  getOnlinePatientsByService,
  scheduleFollowUp,
  getDoctorProfile,
  updateDoctorProfile,
  deleteAppointment
};

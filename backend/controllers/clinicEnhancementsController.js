const db = require("../config/db");
const { getOrCreatePatientIdByUserId } = require('../utils/patientAutoLink');
// 30-minute slot sequence used across the app
const SLOT_SEQUENCE = [
  '8:00-8:30AM','8:30-9:00AM','9:00-9:30AM','9:30-10:00AM',
  '10:00-10:30AM','10:30-11:00AM','11:00-11:30AM','11:30-12:00PM',
  '1:00-1:30PM','1:30-2:00PM','2:00-2:30PM','2:30-3:00PM',
  '3:00-3:30PM','3:30-4:00PM','4:00-4:30PM','4:30-5:00PM'
];

function getConsecutiveSlots(startSlot, count) {
  const startIndex = SLOT_SEQUENCE.indexOf(startSlot);
  if (startIndex === -1) return null;
  const endIndex = startIndex + count;
  if (endIndex > SLOT_SEQUENCE.length) return null;
  return SLOT_SEQUENCE.slice(startIndex, endIndex);
}

function getRequiredSlotsForDuration(durationMinutes) {
  const base = 30;
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.max(1, Math.ceil(durationMinutes / base));
}

function isValidYYYYMMDD(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function ensureDayAvailable(date, callback = () => {}) {
  if (!date) return callback();
  const upsertCalendarSql = `
    INSERT INTO appointments (date, time, title, status)
    VALUES (?, '00:00:00', 'Available', 'available')
    ON DUPLICATE KEY UPDATE title = title, status = status
  `;
  db.query(upsertCalendarSql, [date], () => callback());
}

function buildAutoBookingLink(service, followId, dueDate) {
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (followId) params.set('follow_up_of_booking_id', String(followId));
  if (dueDate) params.set('follow_up_due_on', dueDate);
  return '/booking?' + params.toString();
}

function ensureReferralsTables() {
  const sql1 = `CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    referral_to VARCHAR(255) NOT NULL,
    referral_reason VARCHAR(255) DEFAULT NULL,
    transport_mode VARCHAR(100) DEFAULT NULL,
    diagnosis TEXT DEFAULT NULL,
    treatment_given TEXT DEFAULT NULL,
    referred_by VARCHAR(255) DEFAULT NULL,
    referral_datetime DATETIME DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patient_referrals (patient_id)
  )`;
  const sql2 = `CREATE TABLE IF NOT EXISTS referral_returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referral_id INT NOT NULL,
    return_to VARCHAR(255) DEFAULT NULL,
    return_datetime DATETIME DEFAULT NULL,
    diagnosis TEXT DEFAULT NULL,
    actions_taken TEXT DEFAULT NULL,
    recommendations TEXT DEFAULT NULL,
    signed_by VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referral_returns (referral_id)
  )`;
  db.query(sql1, () => {});
  db.query(sql2, () => {});
}

function ensureMedicationTables() {
  const sql1 = `CREATE TABLE IF NOT EXISTS medication_administration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    admission_id INT DEFAULT NULL,
    administration_date DATE NOT NULL,
    created_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_med_admin_patient (patient_id)
  )`;
  const sql2 = `CREATE TABLE IF NOT EXISTS medication_admin_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    administration_id INT NOT NULL,
    time_administered TIME DEFAULT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dose VARCHAR(100) DEFAULT NULL,
    route VARCHAR(50) DEFAULT NULL,
    administered_by VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_med_entries_admin (administration_id)
  )`;
  db.query(sql1, () => {});
  db.query(sql2, () => {});
}

ensureReferralsTables();
ensureMedicationTables();

try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN temperature_c DECIMAL(4,1) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN maternal_heart_rate INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN respiratory_rate INT NULL", () => {}); } catch (e) {}

try { db.query("ALTER TABLE patients ADD COLUMN partner_name VARCHAR(255) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN partner_age VARCHAR(50) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN partner_occupation VARCHAR(100) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN partner_religion VARCHAR(100) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN lmp DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN edd DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN gravida INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE patients ADD COLUMN para INT NULL", () => {}); } catch (e) {}

try { db.query("ALTER TABLE lab_results MODIFY COLUMN test_category ENUM('blood','urine','cervical_screening','pregnancy','ultrasound','imaging','screening','cbc','blood_typing','vdrl','hepa_b','other') NOT NULL", () => {}); } catch (e) {}
// Ensure birth_plans table has emergency_facility column for PDF completeness
try { db.query("ALTER TABLE birth_plans ADD COLUMN emergency_facility VARCHAR(255) NULL", () => {}); } catch (e) {}

function ensureBirthPlanTable() {
  const sql = `CREATE TABLE IF NOT EXISTS birth_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    partner_name VARCHAR(255) DEFAULT NULL,
    partner_phone VARCHAR(50) DEFAULT NULL,
    transport_mode VARCHAR(100) DEFAULT NULL,
    emergency_facility VARCHAR(255) DEFAULT NULL,
    donor_name VARCHAR(255) DEFAULT NULL,
    donor_phone VARCHAR(50) DEFAULT NULL,
    philhealth_status VARCHAR(100) DEFAULT NULL,
    married BOOLEAN DEFAULT NULL,
    checklist_mother TEXT DEFAULT NULL,
    checklist_baby TEXT DEFAULT NULL,
    consent_signed BOOLEAN DEFAULT NULL,
    signed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_birth_plan_patient (patient_id)
  )`;
  db.query(sql, () => {});
}

ensureBirthPlanTable();

function autoCreateFollowUpBooking(patientId, nextDate, cb) {
  if (!patientId || !isValidYYYYMMDD(nextDate)) return cb(null);
  const getPatientSql = "SELECT first_name, middle_name, last_name, phone, user_id FROM patients WHERE id = ? LIMIT 1";
  db.query(getPatientSql, [patientId], (pErr, pRows) => {
    if (pErr || !pRows.length) return cb(null);
    const p = pRows[0];
    const fullName = [p.first_name || '', p.middle_name || '', p.last_name || ''].filter(Boolean).join(' ').trim();
    const svcSql = "SELECT duration FROM services WHERE name IN ('Prenatal Checkup','Prenatal Care') OR category = 'prenatal_care' LIMIT 1";
    db.query(svcSql, [], (sErr, sRows) => {
      const duration = (sRows && sRows[0] && sRows[0].duration) ? Number(sRows[0].duration) : 30;
      const requiredSlots = getRequiredSlotsForDuration(duration);
      ensureDayAvailable(nextDate, () => {
        const placeholders = new Array(requiredSlots).fill('?').join(',');
        const conflictSql = 'SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (' + placeholders + ") AND request_status != 'declined' AND appointment_status != 'cancelled'";
        const blockedSql = 'SELECT time_slot FROM slots WHERE date = ? AND status = \"not_available\"';
        db.query(blockedSql, [nextDate], (blErr, blRows) => {
          const blockedSet = new Set((blErr ? [] : (blRows || []).map(r => r.time_slot)));
          const chooseSlot = (i) => {
            if (i >= SLOT_SEQUENCE.length) return cb(null);
            const startSlot = SLOT_SEQUENCE[i];
            const seq = getConsecutiveSlots(startSlot, requiredSlots);
            if (!seq) return chooseSlot(i + 1);
            for (const t of seq) { if (blockedSet.has(t)) return chooseSlot(i + 1); }
            db.query(conflictSql, [nextDate, ...seq], (cErr, cRes) => {
              if (cErr) return cb(null);
              if ((cRes && cRes[0] && cRes[0].cnt) ? Number(cRes[0].cnt) > 0 : false) return chooseSlot(i + 1);
              const insertBooking = "INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'ongoing')";
              const userId = p.user_id || null;
              db.query(insertBooking, [userId, fullName, p.phone, 'Prenatal Care', nextDate, startSlot], (iErr, iRes) => {
                if (iErr) return cb(null);
                return cb(iRes.insertId);
              });
            });
          };
          chooseSlot(0);
        });
      });
    });
  });
}

// ============================================
// NEWBORN/BABY RECORDS
// ============================================

// Ensure baby_vitals has extended columns used by newborn monitoring sheet
try {
  db.query("ALTER TABLE baby_vitals ADD COLUMN blood_pressure VARCHAR(50) NULL", () => {});
} catch (e) {}
try {
  db.query("ALTER TABLE baby_vitals ADD COLUMN urine VARCHAR(100) NULL", () => {});
} catch (e) {}
try {
  db.query("ALTER TABLE baby_vitals ADD COLUMN stool VARCHAR(100) NULL", () => {});
} catch (e) {}

// Create baby record
const createBaby = (req, res) => {
  const {
    mother_patient_id, admission_id, first_name, middle_name, last_name,
    birth_date, birth_time, gender, birth_weight_kg, birth_length_cm,
    head_circumference_cm, apgar_1min, apgar_5min, blood_type, complications
  } = req.body;

  if (!mother_patient_id || !birth_date || !gender) {
    return res.status(400).json({ error: "mother_patient_id, birth_date, and gender are required" });
  }

  const sql = `INSERT INTO babies (mother_patient_id, admission_id, first_name, middle_name, last_name,
    birth_date, birth_time, gender, birth_weight_kg, birth_length_cm, head_circumference_cm,
    apgar_1min, apgar_5min, blood_type, complications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [mother_patient_id, admission_id, first_name, middle_name, last_name,
    birth_date, birth_time, gender, birth_weight_kg, birth_length_cm,
    head_circumference_cm, apgar_1min, apgar_5min, blood_type, complications];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating baby record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Baby record created successfully' });
  });
};

// Get babies by mother
const getBabiesByMother = (req, res) => {
  const { patient_id } = req.params;
  
  const sql = `SELECT b.*, 
    CONCAT_WS(' ', b.first_name, b.middle_name, b.last_name) as full_name
    FROM babies b
    WHERE b.mother_patient_id = ?
    ORDER BY b.birth_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching babies:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Add baby vitals
const addBabyVitals = (req, res) => {
  const {
    baby_id, recorded_at, weight_kg, length_cm, head_circumference_cm,
    temperature, heart_rate, respiratory_rate, oxygen_saturation,
    feeding_type, notes, recorded_by, blood_pressure, urine, stool
  } = req.body;

  if (!baby_id || !recorded_at) {
    return res.status(400).json({ error: "baby_id and recorded_at are required" });
  }

  const sql = `INSERT INTO baby_vitals (baby_id, recorded_at, weight_kg, length_cm,
    head_circumference_cm, temperature, heart_rate, respiratory_rate, oxygen_saturation,
    feeding_type, notes, recorded_by, blood_pressure, urine, stool)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [baby_id, recorded_at, weight_kg, length_cm, head_circumference_cm,
    temperature, heart_rate, respiratory_rate, oxygen_saturation, feeding_type, notes, recorded_by, blood_pressure || null, urine || null, stool || null];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding baby vitals:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Baby vitals recorded' });
  });
};

// (High-risk pregnancy flags removed per client request)

// ============================================
// LABORATORY RESULTS
// ============================================

const addLabResult = (req, res) => {
  const {
    patient_id, booking_id, test_type, test_category, test_date,
    result_value, reference_range, unit, status, interpretation, file_path,
    ordered_by, performed_by, reviewed_by, notes, equipment_used, test_location,
    follow_up_required, follow_up_date
  } = req.body;

  if (!patient_id || !test_type || !test_category || !test_date) {
    return res.status(400).json({ error: "patient_id, test_type, test_category, and test_date are required" });
  }

  db.query('SHOW COLUMNS FROM lab_results', (colErr, cols) => {
    if (colErr) {
      console.error('Error introspecting lab_results schema:', colErr);
      return res.status(500).json({ error: 'Database error' });
    }

    const colNames = (cols || []).map(c => String(c.Field));
    const hasNormalRange = colNames.includes('normal_range');
    const hasReferenceRange = colNames.includes('reference_range');
    const include = (name) => colNames.includes(name);

    const insertCols = [
      'patient_id', 'booking_id', 'test_type', 'test_category', 'test_date',
      'result_value'
    ];
    const params = [
      patient_id, booking_id || null, test_type, test_category, test_date,
      result_value || null
    ];

    if (hasNormalRange) { insertCols.push('normal_range'); params.push((req.body.normal_range ?? reference_range) || null); }
    else if (hasReferenceRange) { insertCols.push('reference_range'); params.push(reference_range || req.body.normal_range || null); }

    if (include('unit')) { insertCols.push('unit'); params.push(unit || null); }
    const normalizeStatus = (val) => {
      if (!val) return 'completed';
      const map = { Normal: 'completed', Abnormal: 'abnormal', Critical: 'critical', Pending: 'pending' };
      const lower = String(val).toLowerCase();
      const lowerMap = { normal: 'completed', abnormal: 'abnormal', critical: 'critical', pending: 'pending' };
      return map[val] || lowerMap[lower] || val;
    };
    if (include('status')) { insertCols.push('status'); params.push(normalizeStatus(status)); }
    if (include('interpretation')) { insertCols.push('interpretation'); params.push(interpretation || null); }
    if (include('file_path')) { insertCols.push('file_path'); params.push(file_path || null); }
    if (include('lab_name')) { insertCols.push('lab_name'); params.push(req.body.lab_name || null); }
    if (include('ordered_by')) { insertCols.push('ordered_by'); params.push(ordered_by || null); }
    if (include('performed_by')) { insertCols.push('performed_by'); params.push(performed_by || null); }
    if (include('reviewed_by')) { insertCols.push('reviewed_by'); params.push(reviewed_by || null); }
    if (include('notes')) { insertCols.push('notes'); params.push(notes || null); }
    if (include('equipment_used')) { insertCols.push('equipment_used'); params.push(equipment_used || null); }
    if (include('test_location')) { insertCols.push('test_location'); params.push(test_location || null); }
    if (include('follow_up_required')) { insertCols.push('follow_up_required'); params.push(Boolean(follow_up_required)); }
    if (include('follow_up_date')) { insertCols.push('follow_up_date'); params.push(follow_up_date || null); }

    const placeholders = insertCols.map(() => '?').join(', ');
    const sql = `INSERT INTO lab_results (${insertCols.join(', ')}) VALUES (${placeholders})`;

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error adding lab result:', err);
        return res.status(500).json({ error: 'Database error' });
      }
    if (follow_up_required && isValidYYYYMMDD(follow_up_date)) {
      ensureDayAvailable(follow_up_date, () => {
        const fetchPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ?';
        db.query(fetchPatientSql, [patient_id], (lookupErr, rows) => {
          if (lookupErr || !rows || rows.length === 0) {
            return res.json({ message: 'Lab result added successfully', id: result.insertId });
          }
          const resolvedUserId = rows[0].user_id || null;
          const resolvedPatientName = rows[0].full_name || '';
          const resolvedContactNumber = rows[0].phone || null;
          const serviceName = 'Lab Results';
          const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
          db.query(svcSql, [serviceName], (svcErr, svcRows) => {
            const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
            const requiredSlots = getRequiredSlotsForDuration(duration);
            let idx = 0;
            const tryNext = () => {
              if (idx >= SLOT_SEQUENCE.length) return res.json({ message: 'Lab result added successfully', id: result.insertId, auto_scheduled_followup_booking_id: null });
              const baseSlot = SLOT_SEQUENCE[idx];
              const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
              if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) { idx += 1; return tryNext(); }
              const placeholders = consecutiveSlots.map(() => '?').join(',');
              const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
              db.query(conflictSql, [follow_up_date, ...consecutiveSlots], (confErr, confRows) => {
                if (confErr) { idx += 1; return tryNext(); }
                const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                if (hasConflict) { idx += 1; return tryNext(); }
                const insertSql = `
                  INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                  VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                `;
                db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, follow_up_date, baseSlot, follow_up_date], (insErr, insRes) => {
                  if (insErr) { idx += 1; return tryNext(); }
                  const newId = insRes.insertId;
                  const link = buildAutoBookingLink(serviceName, newId, follow_up_date);
                  return res.json({ message: 'Lab result added successfully', id: result.insertId, auto_scheduled_followup_booking_id: newId, auto_booking_link: link });
                });
              });
            };
            tryNext();
          });
        });
      });
      } else {
        res.json({ message: 'Lab result added successfully', id: result.insertId });
      }
    });
  });
};

// Admit newborn
const addNewbornAdmission = (req, res) => {
  const { baby_id, date_admitted, admitting_diagnosis, notes } = req.body;
  if (!baby_id || !date_admitted) {
    return res.status(400).json({ error: 'baby_id and date_admitted are required' });
  }
  const sql = `INSERT INTO newborn_admissions (baby_id, status, date_admitted, admitting_diagnosis, notes)
               VALUES (?, 'admitted', ?, ?, ?)`;
  db.query(sql, [baby_id, date_admitted, admitting_diagnosis || null, notes || null], (err, result) => {
    if (err) {
      console.error('Error admitting newborn:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Newborn admitted' });
  });
};

// Discharge newborn (summary)
const dischargeNewbornAdmission = (req, res) => {
  const { id } = req.params;
  const { date_discharge, home_medication, follow_up, screening_date, screening_filter_card_no, vitamin_k_date, bcg_date, hepb_date, discharged_by } = req.body;
  if (!id || !date_discharge) {
    return res.status(400).json({ error: 'id and date_discharge are required' });
  }
  const sql = `UPDATE newborn_admissions
               SET status='discharged', date_discharge=?, home_medication=?, follow_up=?, screening_date=?, screening_filter_card_no=?, vitamin_k_date=?, bcg_date=?, hepb_date=?, discharged_by=?
               WHERE id=?`;
  const params = [date_discharge, home_medication || null, follow_up || null, screening_date || null, screening_filter_card_no || null, vitamin_k_date || null, bcg_date || null, hepb_date || null, discharged_by || null, id];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error discharging newborn:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admission not found' });
    }
    res.json({ message: 'Newborn discharged' });
  });
};

// List newborn admissions by baby
const getNewbornAdmissionsByBaby = (req, res) => {
  const { baby_id } = req.params;
  const sql = `SELECT * FROM newborn_admissions WHERE baby_id = ? ORDER BY date_admitted DESC`;
  db.query(sql, [baby_id], (err, rows) => {
    if (err) {
      console.error('Error fetching newborn admissions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
};

const addReferral = (req, res) => {
  const { patient_id, referral_to, referral_reason, transport_mode, diagnosis, treatment_given, referred_by, referral_datetime, notes } = req.body;
  if (!patient_id || !referral_to) return res.status(400).json({ error: 'patient_id and referral_to are required' });
  const sql = `INSERT INTO referrals (patient_id, referral_to, referral_reason, transport_mode, diagnosis, treatment_given, referred_by, referral_datetime, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [patient_id, referral_to, referral_reason || null, transport_mode || null, diagnosis || null, treatment_given || null, referred_by || null, referral_datetime || null, notes || null];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding referral:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Referral added' });
  });
};

const addReferralReturn = (req, res) => {
  const { id } = req.params;
  const { return_to, return_datetime, diagnosis, actions_taken, recommendations, signed_by, notes } = req.body;
  if (!id) return res.status(400).json({ error: 'referral_id is required' });
  const sql = `INSERT INTO referral_returns (referral_id, return_to, return_datetime, diagnosis, actions_taken, recommendations, signed_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [id, return_to || null, return_datetime || null, diagnosis || null, actions_taken || null, recommendations || null, signed_by || null, notes || null];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding referral return:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Referral return added' });
  });
};

const getReferrals = (req, res) => {
  const { patient_id } = req.params;
  const sql = `SELECT r.*, rr.return_datetime, rr.return_to FROM referrals r LEFT JOIN referral_returns rr ON r.id = rr.referral_id WHERE r.patient_id = ? ORDER BY r.created_at DESC`;
  db.query(sql, [patient_id], (err, rows) => {
    if (err) {
      console.error('Error fetching referrals:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
};

const addMedicationAdministration = (req, res) => {
  const { patient_id, admission_id, administration_date, entries, notes } = req.body;
  if (!patient_id || !administration_date || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'patient_id, administration_date and entries are required' });
  }
  const sqlMain = `INSERT INTO medication_administration (patient_id, admission_id, administration_date, created_by, notes) VALUES (?, ?, ?, ?, ?)`;
  const createdBy = (req.user && req.user.id) ? req.user.id : null;
  db.query(sqlMain, [patient_id, admission_id || null, administration_date, createdBy, notes || null], (err, result) => {
    if (err) {
      console.error('Error creating medication administration:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const adminId = result.insertId;
    const sqlEntry = `INSERT INTO medication_admin_entries (administration_id, time_administered, medication_name, dose, route, administered_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const insertNext = (i) => {
      if (i >= entries.length) return res.status(201).json({ id: adminId, message: 'Medication administration added' });
      const e = entries[i] || {};
      const params = [adminId, e.time_administered || null, e.medication_name || '', e.dose || null, e.route || null, e.administered_by || null, e.notes || null];
      db.query(sqlEntry, params, (eErr) => {
        if (eErr) {
          console.error('Error adding medication entry:', eErr);
          return res.status(500).json({ error: 'Database error' });
        }
        insertNext(i + 1);
      });
    };
    insertNext(0);
  });
};

const getMedicationAdministrationByPatient = (req, res) => {
  const { patient_id } = req.params;
  const sql = `SELECT ma.*, e.id AS entry_id, e.time_administered, e.medication_name, e.dose, e.route, e.administered_by, e.notes
               FROM medication_administration ma
               LEFT JOIN medication_admin_entries e ON ma.id = e.administration_id
               WHERE ma.patient_id = ?
               ORDER BY ma.administration_date DESC, e.time_administered ASC`;
  db.query(sql, [patient_id], (err, rows) => {
    if (err) {
      console.error('Error fetching medication administration:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
};

const addBirthPlan = (req, res) => {
  const { patient_id, partner_name, partner_phone, transport_mode, emergency_facility, donor_name, donor_phone, philhealth_status, married, checklist_mother, checklist_baby, consent_signed, signed_at } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });
  const sql = `INSERT INTO birth_plans (patient_id, partner_name, partner_phone, transport_mode, emergency_facility, donor_name, donor_phone, philhealth_status, married, checklist_mother, checklist_baby, consent_signed, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [patient_id, partner_name || null, partner_phone || null, transport_mode || null, emergency_facility || null, donor_name || null, donor_phone || null, philhealth_status || null, married ?? null, checklist_mother || null, checklist_baby || null, consent_signed ?? null, signed_at || null];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding birth plan:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Birth plan saved' });
  });
};

const getBirthPlan = (req, res) => {
  const { patient_id } = req.params;
  const sql = `SELECT * FROM birth_plans WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`;
  db.query(sql, [patient_id], (err, rows) => {
    if (err) {
      console.error('Error fetching birth plan:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows && rows[0] ? rows[0] : null);
  });
};

const getBirthPlans = (req, res) => {
  const { patient_id } = req.params;
  const sql = `SELECT * FROM birth_plans WHERE patient_id = ? ORDER BY created_at DESC`;
  db.query(sql, [patient_id], (err, rows) => {
    if (err) {
      console.error('Error fetching birth plans:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
};

const updateBirthPlan = (req, res) => {
  const { id } = req.params;
  const { partner_name, partner_phone, transport_mode, emergency_facility, donor_name, donor_phone, philhealth_status, married, checklist_mother, checklist_baby, consent_signed, signed_at } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  const sql = `UPDATE birth_plans SET partner_name = ?, partner_phone = ?, transport_mode = ?, emergency_facility = ?, donor_name = ?, donor_phone = ?, philhealth_status = ?, married = ?, checklist_mother = ?, checklist_baby = ?, consent_signed = ?, signed_at = ? WHERE id = ?`;
  const params = [
    partner_name || null,
    partner_phone || null,
    transport_mode || null,
    emergency_facility || null,
    donor_name || null,
    donor_phone || null,
    philhealth_status || null,
    married ?? null,
    checklist_mother || null,
    checklist_baby || null,
    consent_signed ?? null,
    signed_at || null,
    id
  ];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating birth plan:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ affectedRows: result.affectedRows, message: 'Birth plan updated' });
  });
};

const deleteBirthPlan = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id is required' });
  const sql = `DELETE FROM birth_plans WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting birth plan:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ affectedRows: result.affectedRows, message: 'Birth plan deleted' });
  });
};

const getLabResults = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT * FROM lab_results WHERE patient_id = ? ORDER BY test_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching lab results:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteLabResult = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM lab_results WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting lab result:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lab result not found' });
    }
    res.json({ message: 'Lab result deleted successfully' });
  });
};

// ============================================
// PRENATAL VISIT TRACKING
// ============================================

try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN temperature_c DECIMAL(5,2) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN maternal_heart_rate INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN respiratory_rate INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN visit_notes TEXT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN visit_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE prenatal_schedule ADD COLUMN booking_id INT NULL", () => {}); } catch (e) {}

function resolvePregnancyIdForDate(patientId, dateString, done) {
  const d = dateString ? new Date(dateString) : null;
  if (!patientId || !d) return done(null, null);
  const babiesSql = `SELECT birth_date FROM babies WHERE mother_patient_id = ? AND birth_date IS NOT NULL ORDER BY birth_date ASC`;
  db.query(babiesSql, [patientId], (bErr, bRows) => {
    if (bErr) return done(bErr);
    const births = (bRows || []).map(r => r.birth_date).filter(Boolean).map(x => new Date(x)).sort((a,b) => a - b);
    if (births.length > 0) {
      let count = 0;
      for (const bd of births) { if (d > bd) count++; else break; }
      return done(null, count + 1);
    }
    const admSql = `SELECT COALESCE(delivered_at, admitted_at) AS pivot FROM admissions WHERE patient_id = ? AND (delivered_at IS NOT NULL OR admitted_at IS NOT NULL) ORDER BY COALESCE(delivered_at, admitted_at) ASC`;
    db.query(admSql, [patientId], (aErr, aRows) => {
      if (aErr) return done(aErr);
      const pivots = (aRows || []).map(r => r.pivot).filter(Boolean).map(x => new Date(x)).sort((a,b) => a - b);
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

const createPrenatalSchedule = (req, res) => {
  const {
    patient_id, pregnancy_id, visit_number, trimester, scheduled_date,
    gestational_age, fundal_height_cm, fetal_heart_rate, blood_pressure,
    weight_kg, edema, complaints, assessment, plan, next_visit_date
  } = req.body;

  if (!patient_id || !visit_number || !trimester || !scheduled_date) {
    return res.status(400).json({ error: "patient_id, visit_number, trimester, and scheduled_date are required" });
  }

  const proceed = (pid) => {
    const sql = `INSERT INTO prenatal_schedule (patient_id, pregnancy_id, visit_number, trimester,
    scheduled_date, gestational_age, fundal_height_cm, fetal_heart_rate, blood_pressure, weight_kg,
    edema, complaints, assessment, plan, next_visit_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [patient_id, pid, visit_number, trimester, scheduled_date, gestational_age,
    fundal_height_cm, fetal_heart_rate, blood_pressure, weight_kg, edema, complaints, assessment, plan, next_visit_date];
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating prenatal schedule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (isValidYYYYMMDD(next_visit_date)) {
      autoCreateFollowUpBooking(patient_id, next_visit_date, (newBookingId) => {
        const link = buildAutoBookingLink('Prenatal Checkup', newBookingId, next_visit_date);
        res.status(201).json({ id: result.insertId, message: 'Prenatal visit scheduled', auto_scheduled_followup_booking_id: newBookingId, auto_booking_link: link });
      });
    } else {
      res.status(201).json({ id: result.insertId, message: 'Prenatal visit scheduled' });
    }
  });
  };

  if (!pregnancy_id) {
    return resolvePregnancyIdForDate(patient_id, scheduled_date, (rErr, pid) => {
      if (rErr) {
        console.error('Error resolving pregnancy_id:', rErr);
        return res.status(500).json({ error: 'Database error' });
      }
      proceed(pid);
    });
  }
  proceed(pregnancy_id);
};

const getPrenatalSchedule = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT * FROM prenatal_schedule WHERE patient_id = ? ORDER BY scheduled_date ASC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching prenatal schedule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const completePrenatalVisit = (req, res) => {
  const { id } = req.params;
  const {
    completed_date, fundal_height_cm, fetal_heart_rate, blood_pressure,
    weight_kg, edema, complaints, assessment, plan, next_visit_date
  } = req.body;

  const sql = `UPDATE prenatal_schedule SET 
    completed_date = ?, fundal_height_cm = ?, fetal_heart_rate = ?, blood_pressure = ?,
    weight_kg = ?, edema = ?, complaints = ?, assessment = ?, plan = ?, next_visit_date = ?,
    status = 'completed', attended = TRUE
    WHERE id = ?`;

  const params = [completed_date, fundal_height_cm, fetal_heart_rate, blood_pressure,
    weight_kg, edema, complaints, assessment, plan, next_visit_date, id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error completing prenatal visit:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (isValidYYYYMMDD(next_visit_date)) {
      const getPatientSql = 'SELECT patient_id FROM prenatal_schedule WHERE id = ? LIMIT 1';
      db.query(getPatientSql, [id], (gErr, gRows) => {
        if (gErr || !gRows.length) return res.json({ message: 'Prenatal visit completed' });
        const pid = gRows[0].patient_id;
        autoCreateFollowUpBooking(pid, next_visit_date, (newBookingId) => {
          const link = buildAutoBookingLink('Prenatal Checkup', newBookingId, next_visit_date);
          res.json({ message: 'Prenatal visit completed', auto_scheduled_followup_booking_id: newBookingId, auto_booking_link: link });
        });
      });
    } else {
      res.json({ message: 'Prenatal visit completed' });
    }
  });
};

const updatePrenatalSchedule = (req, res) => {
  const { id } = req.params;
  const {
    pregnancy_id,
    visit_number,
    trimester,
    scheduled_date,
    gestational_age,
    weight_kg,
    blood_pressure,
    fundal_height_cm,
    fetal_heart_rate,
    temperature_c,
    maternal_heart_rate,
    respiratory_rate,
    status,
    notes,
    next_visit_date
  } = req.body;

  if (!id) return res.status(400).json({ error: 'Missing prenatal schedule id' });

  const sql = `UPDATE prenatal_schedule SET
    pregnancy_id = COALESCE(?, pregnancy_id),
    visit_number = COALESCE(?, visit_number),
    trimester = COALESCE(?, trimester),
    scheduled_date = COALESCE(?, scheduled_date),
    gestational_age = COALESCE(?, gestational_age),
    weight_kg = COALESCE(?, weight_kg),
    blood_pressure = COALESCE(?, blood_pressure),
    fundal_height_cm = COALESCE(?, fundal_height_cm),
    fetal_heart_rate = COALESCE(?, fetal_heart_rate),
    temperature_c = COALESCE(?, temperature_c),
    maternal_heart_rate = COALESCE(?, maternal_heart_rate),
    respiratory_rate = COALESCE(?, respiratory_rate),
    status = COALESCE(?, status),
    notes = COALESCE(?, notes),
    next_visit_date = COALESCE(?, next_visit_date)
    WHERE id = ?`;

  const params = [
    pregnancy_id || null,
    visit_number || null,
    trimester || null,
    scheduled_date || null,
    gestational_age || null,
    weight_kg || null,
    blood_pressure || null,
    fundal_height_cm || null,
    fetal_heart_rate || null,
    temperature_c || null,
    maternal_heart_rate || null,
    respiratory_rate || null,
    status || null,
    notes || null,
    next_visit_date || null,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating prenatal schedule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prenatal schedule not found' });
    }
    if (isValidYYYYMMDD(next_visit_date)) {
      const getPatientSql = 'SELECT patient_id FROM prenatal_schedule WHERE id = ? LIMIT 1';
      db.query(getPatientSql, [id], (gErr, gRows) => {
        if (gErr || !gRows.length) return res.json({ message: 'Prenatal schedule updated' });
        const pid = gRows[0].patient_id;
        ensureDayAvailable(next_visit_date, () => {
          autoCreateFollowUpBooking(pid, next_visit_date, (newBookingId) => {
            const link = buildAutoBookingLink('Prenatal Checkup', newBookingId, next_visit_date);
            res.json({ message: 'Prenatal schedule updated', auto_scheduled_followup_booking_id: newBookingId, auto_booking_link: link });
          });
        });
      });
    } else {
      res.json({ message: 'Prenatal schedule updated' });
    }
  });
};

const deletePrenatalSchedule = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing prenatal schedule id' });
  const sql = 'DELETE FROM prenatal_schedule WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting prenatal schedule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prenatal schedule not found' });
    }
    res.json({ message: 'Prenatal schedule deleted successfully' });
  });
};

// ============================================
// POSTPARTUM CARE
// ============================================

try { db.query("ALTER TABLE postpartum_care ADD COLUMN pregnancy_id INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN booking_id INT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN assessment_notes TEXT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN recovery_status VARCHAR(100) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN follow_up_plan TEXT NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN next_visit_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN iron_supplement_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN vitamin_a_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN deworming_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN tt_booster_date DATE NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN foul_smell_discharge TINYINT(1) DEFAULT 0", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN family_planning_method VARCHAR(100) NULL", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN fever TINYINT(1) DEFAULT 0", () => {}); } catch (e) {}
try { db.query("ALTER TABLE postpartum_care ADD COLUMN vaginal_bleeding TINYINT(1) DEFAULT 0", () => {}); } catch (e) {}

const addPostpartumAssessment = (req, res) => {
  console.log('Received postpartum data:', req.body);
  
  const {
    patient_id, admission_id, day_postpartum, assessment_date,
    blood_pressure, temperature, pulse, fundal_height, lochia_type,
    lochia_amount, perineum_condition, breasts_condition, breastfeeding_status,
    mood_assessment, voiding_normal, bowel_movement_normal, notes, assessed_by,
    next_visit_date, iron_supplement_date, vitamin_a_date, deworming_date, tt_booster_date,
    foul_smell_discharge, family_planning_method, fever, vaginal_bleeding
  } = req.body;

  console.log('Required fields check:', { patient_id, day_postpartum, assessment_date });

  if (!patient_id || !day_postpartum || !assessment_date) {
    console.log('Validation failed - missing required fields');
    return res.status(400).json({ error: "patient_id, day_postpartum, and assessment_date are required" });
  }

  const sql = `INSERT INTO postpartum_care (patient_id, admission_id, pregnancy_id, day_postpartum, assessment_date,
    blood_pressure, temperature, pulse, fundal_height, lochia_type, lochia_amount, perineum_condition,
    breasts_condition, breastfeeding_status, mood_assessment, voiding_normal, bowel_movement_normal,
    notes, assessed_by, next_visit_date, iron_supplement_date, vitamin_a_date, deworming_date, tt_booster_date,
    foul_smell_discharge, family_planning_method, fever, vaginal_bleeding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [patient_id, admission_id, (req.body.pregnancy_id || null), day_postpartum, assessment_date, blood_pressure,
    temperature, pulse, fundal_height, lochia_type, lochia_amount, perineum_condition,
    breasts_condition, breastfeeding_status, mood_assessment, voiding_normal,
    bowel_movement_normal, notes, assessed_by, next_visit_date || null, iron_supplement_date || null, vitamin_a_date || null, deworming_date || null, tt_booster_date || null,
    foul_smell_discharge ? 1 : 0, family_planning_method || null, fever ? 1 : 0, vaginal_bleeding ? 1 : 0];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding postpartum assessment:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (isValidYYYYMMDD(next_visit_date)) {
      ensureDayAvailable(next_visit_date, () => {
        const getPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ? LIMIT 1';
        db.query(getPatientSql, [patient_id], (pErr, pRows) => {
          if (pErr || !pRows || pRows.length === 0) {
            return res.status(201).json({ id: result.insertId, message: 'Postpartum assessment recorded' });
          }
          const resolvedUserId = pRows[0].user_id || null;
          const resolvedPatientName = pRows[0].full_name || '';
          const resolvedContactNumber = pRows[0].phone || null;
          const serviceName = 'Maternity and Postpartum Care';
          const svcSql = `SELECT duration FROM services WHERE name = ? OR category = 'postpartum' LIMIT 1`;
          db.query(svcSql, [serviceName], (svcErr, svcRows) => {
            const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? Number(svcRows[0].duration) : 30;
            const requiredSlots = getRequiredSlotsForDuration(duration);
            let idx = 0;
            const tryNext = () => {
              if (idx >= SLOT_SEQUENCE.length) return res.status(201).json({ id: result.insertId, message: 'Postpartum assessment recorded', auto_scheduled_followup_booking_id: null });
              const baseSlot = SLOT_SEQUENCE[idx];
              const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
              if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) { idx += 1; return tryNext(); }
              const placeholders = consecutiveSlots.map(() => '?').join(',');
              const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
              db.query(conflictSql, [next_visit_date, ...consecutiveSlots], (cErr, cRows) => {
                if (cErr) { idx += 1; return tryNext(); }
                const hasConflict = cRows && cRows[0] && Number(cRows[0].cnt) > 0;
                if (hasConflict) { idx += 1; return tryNext(); }
                const insertSql = `
                  INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                  VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                `;
                db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, next_visit_date, baseSlot, next_visit_date], (iErr, iRes) => {
                  if (iErr) { idx += 1; return tryNext(); }
                  const newId = iRes.insertId;
                  const link = buildAutoBookingLink(serviceName, newId, next_visit_date);
                  return res.status(201).json({ id: result.insertId, message: 'Postpartum assessment recorded', auto_scheduled_followup_booking_id: newId, auto_booking_link: link });
                });
              });
            };
            tryNext();
          });
        });
      });
    } else {
      res.status(201).json({ id: result.insertId, message: 'Postpartum assessment recorded' });
    }
  });
};

const getPostpartumAssessments = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT pc.*, u.name as assessor_name
    FROM postpartum_care pc
    LEFT JOIN users u ON pc.assessed_by = u.id
    WHERE pc.patient_id = ?
    ORDER BY pc.day_postpartum ASC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching postpartum assessments:', err);
      console.error('Error details:', err.message, err.code);
      // Return empty array instead of error to allow graceful handling
      return res.json([]);
    }
    res.json(results || []);
  });
};

const deletePostpartumAssessment = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM postpartum_care WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting postpartum assessment:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Postpartum assessment not found' });
    }
    res.json({ message: 'Postpartum assessment deleted successfully' });
  });
};

// ============================================
// MEDICAL CERTIFICATES
// ============================================

const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MC-${year}${month}-${random}`;
};

const createMedicalCertificate = (req, res) => {
  const {
    patient_id, certificate_type, issue_date, valid_from, valid_to,
    diagnosis, recommendations, purpose, issued_by
  } = req.body;

  if (!patient_id || !certificate_type || !issue_date || !issued_by) {
    return res.status(400).json({ error: "patient_id, certificate_type, issue_date, and issued_by are required" });
  }

  const certificate_number = generateCertificateNumber();

  const sql = `INSERT INTO medical_certificates (patient_id, certificate_type, issue_date, valid_from,
    valid_to, diagnosis, recommendations, purpose, issued_by, certificate_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [patient_id, certificate_type, issue_date, valid_from, valid_to, diagnosis,
    recommendations, purpose, issued_by, certificate_number];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating medical certificate:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, certificate_number, message: 'Medical certificate created' });
  });
};

const getMedicalCertificates = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT mc.*, u.name as issued_by_name
    FROM medical_certificates mc
    LEFT JOIN users u ON mc.issued_by = u.id
    WHERE mc.patient_id = ?
    ORDER BY mc.issue_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching medical certificates:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// ============================================
// BILLING REMOVED PER CLIENT REQUEST
// ============================================

// ============================================
// FAMILY PLANNING
// ============================================

const addFamilyPlanning = (req, res) => {
  const {
    patient_id,
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

  if (!patient_id || !consultation_date) {
    return res.status(400).json({ error: "patient_id and consultation_date are required" });
  }

  // Normalize optional fields: empty strings -> null; ensure types for DB
  const normalizedMethodChosen = (method_chosen && String(method_chosen).trim() !== '') ? method_chosen : null;
  const normalizedMethodStartedDate = (method_started_date && String(method_started_date).trim() !== '') ? method_started_date : null;
  const normalizedFollowUpDate = (follow_up_date && String(follow_up_date).trim() !== '') ? follow_up_date : null;
  const normalizedNotes = (notes && String(notes).trim() !== '') ? notes : null;
  const normalizedSideEffects = (side_effects && String(side_effects).trim() !== '') ? side_effects : null;

  // Normalize counseling_done to tinyint(1) 0/1
  const normalizedCounselingDone = !!(Number(counseling_done) || counseling_done === true) ? 1 : 0;

  // Normalize counseled_by: numeric users.id or null
  let counselorValue = null;
  if (typeof counseled_by !== 'undefined' && counseled_by !== null) {
    const idNum = parseInt(counseled_by, 10);
    counselorValue = Number.isFinite(idNum) && idNum > 0 ? idNum : null;
  }

  const sql = `INSERT INTO family_planning (
      patient_id,
      consultation_date,
      method_chosen,
      method_started_date,
      method_category,
      counseling_done,
      side_effects,
      follow_up_date,
      notes,
      counseled_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    patient_id,
    consultation_date,
    normalizedMethodChosen,
    normalizedMethodStartedDate,
    method_category,
    normalizedCounselingDone,
    normalizedSideEffects,
    normalizedFollowUpDate,
    normalizedNotes,
    counselorValue
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error adding family planning record:', err);
      console.error('Error details:', err.message, err.code);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (isValidYYYYMMDD(normalizedFollowUpDate)) {
      ensureDayAvailable(normalizedFollowUpDate, () => {
        const fetchPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ?';
        db.query(fetchPatientSql, [patient_id], (lookupErr, rows) => {
          if (lookupErr || !rows || rows.length === 0) {
            return res.status(201).json({ id: result.insertId, message: 'Family planning record added' });
          }
          const resolvedUserId = rows[0].user_id || null;
          const resolvedPatientName = rows[0].full_name || '';
          const resolvedContactNumber = rows[0].phone || null;
          const serviceName = 'Family Planning';
          const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
          db.query(svcSql, [serviceName], (svcErr, svcRows) => {
            const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
            const requiredSlots = getRequiredSlotsForDuration(duration);
            let idx = 0;
            const tryNext = () => {
              if (idx >= SLOT_SEQUENCE.length) return res.status(201).json({ id: result.insertId, message: 'Family planning record added', auto_scheduled_followup_booking_id: null });
              const baseSlot = SLOT_SEQUENCE[idx];
              const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
              if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) {
                idx += 1;
                return tryNext();
              }
              const placeholders = consecutiveSlots.map(() => '?').join(',');
              const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
              db.query(conflictSql, [normalizedFollowUpDate, ...consecutiveSlots], (confErr, confRows) => {
                if (confErr) { idx += 1; return tryNext(); }
                const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                if (hasConflict) { idx += 1; return tryNext(); }
                const insertSql = `
                  INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                  VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                `;
                db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, normalizedFollowUpDate, baseSlot, normalizedFollowUpDate], (insErr, insRes) => {
                  if (insErr) { idx += 1; return tryNext(); }
                  const newId = insRes.insertId;
                  const link = buildAutoBookingLink(serviceName, newId, normalizedFollowUpDate);
                  return res.status(201).json({ id: result.insertId, message: 'Family planning record added', auto_scheduled_followup_booking_id: newId, auto_booking_link: link });
                });
              });
            };
            tryNext();
          });
        });
      });
    } else {
      res.status(201).json({ id: result.insertId, message: 'Family planning record added' });
    }
  });
};

const getFamilyPlanning = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT fp.*, u.name as counselor_name
    FROM family_planning fp
    LEFT JOIN users u ON fp.counseled_by = u.id
    WHERE fp.patient_id = ?
    ORDER BY fp.consultation_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching family planning records:', err);
      console.error('Error details:', err.message, err.code);
      // Return empty array instead of error to allow graceful handling
      return res.json([]);
    }
    res.json(results || []);
  });
};

// Update existing family planning record (registered patient)
const updateFamilyPlanning = (req, res) => {
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

  if (!id) {
    return res.status(400).json({ error: 'Record id is required' });
  }

  // Normalize optional fields and types
  const normalizedMethodChosen = (method_chosen && String(method_chosen).trim() !== '') ? method_chosen : null;
  const normalizedMethodStartedDate = (method_started_date && String(method_started_date).trim() !== '') ? method_started_date : null;
  const normalizedFollowUpDate = (follow_up_date && String(follow_up_date).trim() !== '') ? follow_up_date : null;
  const normalizedNotes = (notes && String(notes).trim() !== '') ? notes : null;
  const normalizedSideEffects = (side_effects && String(side_effects).trim() !== '') ? side_effects : null;

  const normalizedCounselingDone = !!(Number(counseling_done) || counseling_done === true) ? 1 : 0;

  let counselorValue = null;
  if (typeof counseled_by !== 'undefined' && counseled_by !== null) {
    const idNum = parseInt(counseled_by, 10);
    counselorValue = Number.isFinite(idNum) && idNum > 0 ? idNum : null;
  }

  const sql = `
    UPDATE family_planning
    SET consultation_date = ?,
        method_chosen = ?,
        method_started_date = ?,
        method_category = ?,
        counseling_done = ?,
        side_effects = ?,
        follow_up_date = ?,
        notes = ?,
        counseled_by = ?
    WHERE id = ?
  `;

  const params = [
    consultation_date,
    normalizedMethodChosen,
    normalizedMethodStartedDate,
    method_category,
    normalizedCounselingDone,
    normalizedSideEffects,
    normalizedFollowUpDate,
    normalizedNotes,
    counselorValue,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating family planning record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Family planning record not found' });
    }
    if (isValidYYYYMMDD(normalizedFollowUpDate)) {
      ensureDayAvailable(normalizedFollowUpDate, () => {
        // Fetch patient_id via the updated record to auto-schedule (if possible)
        const getPatientIdSql = `SELECT patient_id FROM family_planning WHERE id = ? LIMIT 1`;
        db.query(getPatientIdSql, [id], (fpErr, fpRows) => {
          if (fpErr || !fpRows || fpRows.length === 0) {
            return res.json({ message: 'Family planning record updated successfully' });
          }
          const patientId = fpRows[0].patient_id;
          const fetchPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ?';
          db.query(fetchPatientSql, [patientId], (lookupErr, rows) => {
            if (lookupErr || !rows || rows.length === 0) {
              return res.json({ message: 'Family planning record updated successfully' });
            }
            const resolvedUserId = rows[0].user_id || null;
            const resolvedPatientName = rows[0].full_name || '';
            const resolvedContactNumber = rows[0].phone || null;
            if (!resolvedUserId) {
              return res.json({ message: 'Family planning record updated successfully' });
            }
            const serviceName = 'Family Planning';
            const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
            db.query(svcSql, [serviceName], (svcErr, svcRows) => {
              if (svcErr) {
                console.error('Family Planning update auto-schedule services error:', svcErr);
                return res.json({ message: 'Family planning record updated successfully' });
              }
              const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
              const requiredSlots = getRequiredSlotsForDuration(duration);
              let idx = 0;
              const tryNext = () => {
                if (idx >= SLOT_SEQUENCE.length) return res.json({ message: 'Family planning record updated successfully', auto_scheduled_followup_booking_id: null });
                const baseSlot = SLOT_SEQUENCE[idx];
                const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
                if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) {
                  idx += 1;
                  return tryNext();
                }
                const placeholders = consecutiveSlots.map(() => '?').join(',');
                const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
                db.query(conflictSql, [normalizedFollowUpDate, ...consecutiveSlots], (confErr, confRows) => {
                  if (confErr) {
                    console.error('Family Planning update auto-schedule conflict check error:', confErr);
                    idx += 1;
                    return tryNext();
                  }
                  const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                  if (hasConflict) {
                    idx += 1;
                    return tryNext();
                  }
                  const insertSql = `
                    INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                    VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                  `;
                  db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, normalizedFollowUpDate, baseSlot, normalizedFollowUpDate], (insErr, insRes) => {
                    if (insErr) {
                      console.error('Family Planning update auto-schedule insert error:', insErr);
                      idx += 1;
                      return tryNext();
                    }
                    const newId = insRes.insertId;
                    const link = buildAutoBookingLink(serviceName, newId, normalizedFollowUpDate);
                    return res.json({ message: 'Family planning record updated successfully', auto_scheduled_followup_booking_id: newId, auto_booking_link: link });
                  });
                });
              };
              tryNext();
            });
          });
        });
      });
    } else {
      res.json({ message: 'Family planning record updated successfully' });
    }
  });
};

const deleteFamilyPlanning = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM family_planning WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting family planning record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Family planning record not found' });
    }
    res.json({ message: 'Family planning record deleted successfully' });
  });
};

// ============================================
// (Walk-in merge removed per client request: walk-ins are patients)

// ============================================
// EXPORTS
// ============================================

// ============================================
// SCREENING MANAGEMENT
// ============================================
const addScreening = (req, res) => {
  const {
    patient_id, patient_name, contact_number, test_type, date_performed,
    gestational_age, birth_weight_kg, screening_method, result, interpretation,
    recommendations, follow_up_required, follow_up_date, status, healthcare_provider,
    reviewed_by, lab_name, notes, equipment_used, test_location
  } = req.body;

  // Basic validation for required fields when recording screening for registered patients
  if (!patient_id || !test_type || !date_performed) {
    return res.status(400).json({ error: 'patient_id, test_type, and date_performed are required' });
  }

  // Normalize status values from UI to DB enum
  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Pending: 'pending',
      Inconclusive: 'requires_follow_up'
    };
    return map[val] || String(val).toLowerCase();
  };

  const resolvedStatus = normalizeStatus(status);
  const reviewedBy = reviewed_by ? parseInt(reviewed_by, 10) || null : null;

  // If patient_name/contact_number not provided, derive from patients table using patient_id
  const fetchPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ?';

  db.query(fetchPatientSql, [patient_id], (lookupErr, rows) => {
    if (lookupErr) {
      console.error('Error looking up patient for screening:', lookupErr);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const resolvedPatientName = patient_name || rows[0].full_name || '';
    const resolvedContactNumber = contact_number || rows[0].phone || null;
    const resolvedUserId = rows[0].user_id || null;

    const sql = `INSERT INTO screenings 
      (patient_id, patient_name, contact_number, screening_type, screening_date,
       gestational_age, birth_weight_kg, screening_method, results, interpretation,
       recommendations, follow_up_required, follow_up_date, status, screened_by,
       reviewed_by, lab_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      patient_id, resolvedPatientName, resolvedContactNumber, test_type, date_performed,
      gestational_age, birth_weight_kg, screening_method, result, interpretation,
      recommendations, !!follow_up_required, follow_up_date, resolvedStatus,
      healthcare_provider, reviewedBy, lab_name, notes
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error adding screening:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (follow_up_required && isValidYYYYMMDD(follow_up_date)) {
        ensureDayAvailable(follow_up_date, () => {
          // Auto-schedule follow-up for registered patients
          const tryAutoSchedule = (dateStr, done) => {
            const serviceName = 'Screening';
            const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
            db.query(svcSql, [serviceName], (svcErr, svcRows) => {
              if (svcErr) {
                console.error('Screening auto-schedule services error:', svcErr);
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
                    console.error('Screening auto-schedule conflict check error:', confErr);
                    idx += 1;
                    return tryNext();
                  }
                  const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                  if (hasConflict) {
                    idx += 1;
                    return tryNext();
                  }
                  const insertSql = `
                    INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                    VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                  `;
                  db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, dateStr, baseSlot, dateStr], (insErr, insRes) => {
                    if (insErr) {
                      console.error('Screening auto-schedule insert error:', insErr);
                      idx += 1;
                      return tryNext();
                    }
                    const newId = insRes.insertId;
                    return done(newId);
                  });
                });
              };
              tryNext();
            });
          };

          tryAutoSchedule(follow_up_date, (createdId) => {
            const link = createdId ? buildAutoBookingLink('Screening', createdId, follow_up_date) : null;
            res.json({ message: 'Screening added successfully', id: result.insertId, auto_scheduled_followup_booking_id: createdId || null, auto_booking_link: link });
          });
        });
      } else {
        res.json({ message: 'Screening added successfully', id: result.insertId });
      }
    });
  });
};

const getScreenings = (req, res) => {
  const { patient_id } = req.params;

  const sql = `
    SELECT 
      id,
      patient_id,
      patient_name,
      contact_number,
      screening_type AS test_type,
      screening_date AS date_performed,
      results AS result,
      CASE 
        WHEN status = 'completed' THEN 'Normal'
        WHEN status = 'abnormal' THEN 'Abnormal'
        WHEN status = 'pending' THEN 'Pending'
        WHEN status = 'requires_follow_up' THEN 'Inconclusive'
        ELSE status
      END AS status,
      screened_by AS healthcare_provider,
      interpretation,
      recommendations,
      follow_up_required,
      follow_up_date,
      lab_name,
      notes
    FROM screenings 
    WHERE patient_id = ? 
    ORDER BY screening_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching screenings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteScreening = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM screenings WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting screening:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Screening not found' });
    }
    res.json({ message: 'Screening deleted successfully' });
  });
};

// Update existing screening record (registered patient)
const updateScreening = (req, res) => {
  const { id } = req.params;
  const {
    test_type,
    date_performed,
    gestational_age,
    birth_weight_kg,
    screening_method,
    result,
    interpretation,
    recommendations,
    follow_up_required,
    follow_up_date,
    status,
    healthcare_provider,
    reviewed_by,
    lab_name,
    notes
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Record id is required' });
  }

  const normalizeStatus = (val) => {
    if (!val) return 'pending';
    const map = {
      Normal: 'completed',
      Abnormal: 'abnormal',
      Pending: 'pending',
      Inconclusive: 'requires_follow_up'
    };
    return map[val] || String(val).toLowerCase();
  };

  const resolvedStatus = normalizeStatus(status);
  const reviewedBy = reviewed_by ? parseInt(reviewed_by, 10) || null : null;

  const sql = `
    UPDATE screenings
    SET screening_type = ?,
        screening_date = ?,
        gestational_age = ?,
        birth_weight_kg = ?,
        screening_method = ?,
        results = ?,
        interpretation = ?,
        recommendations = ?,
        follow_up_required = ?,
        follow_up_date = ?,
        status = ?,
        screened_by = ?,
        reviewed_by = ?,
        lab_name = ?,
        notes = ?
    WHERE id = ?
  `;

  const params = [
    test_type,
    date_performed,
    gestational_age,
    birth_weight_kg,
    screening_method,
    result,
    interpretation,
    recommendations,
    !!follow_up_required,
    follow_up_date,
    resolvedStatus,
    healthcare_provider,
    reviewedBy,
    lab_name,
    notes,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating screening:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Screening not found' });
    }
    if (follow_up_required && isValidYYYYMMDD(follow_up_date)) {
      ensureDayAvailable(follow_up_date, () => {
        res.json({ message: 'Screening updated successfully' });
      });
    } else {
      res.json({ message: 'Screening updated successfully' });
    }
  });
};

// ============================================
// PROCEDURE MANAGEMENT
// ============================================
const addProcedure = (req, res) => {
  const {
    patient_id, patient_name, contact_number, procedure_type, procedure_category,
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
    patient_id, patient_name, contact_number, procedure_type, procedure_category,
    date_performed, procedure_time, duration_minutes, anesthesia_type, surgeon,
    assistant, location, indication, description, complications, outcome,
    post_op_instructions, follow_up_required || false, next_appointment,
    status || 'scheduled', priority || 'routine', cost, notes
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding procedure:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (follow_up_required && isValidYYYYMMDD(next_appointment)) {
      ensureDayAvailable(next_appointment, () => {
        res.json({ message: 'Procedure added successfully', id: result.insertId });
      });
    } else {
      res.json({ message: 'Procedure added successfully', id: result.insertId });
    }
  });
};

const getProcedures = (req, res) => {
  const { patient_id } = req.params;

  const sql = `
    SELECT 
      id,
      patient_id,
      patient_name,
      contact_number,
      procedure_name AS procedure_type,
      procedure_date AS date_performed,
      CASE 
        WHEN status = 'completed' THEN 'Completed'
        WHEN status = 'scheduled' THEN 'Scheduled'
        WHEN status = 'cancelled' THEN 'Cancelled'
        ELSE status
      END AS status,
      surgeon AS healthcare_provider,
      follow_up_date AS next_appointment,
      anesthesia_type,
      assistant,
      location,
      indication,
      description,
      complications,
      outcome,
      post_op_instructions,
      follow_up_required,
      priority,
      cost,
      notes
    FROM procedures 
    WHERE patient_id = ? 
    ORDER BY procedure_date DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching procedures:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteProcedure = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM procedures WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting procedure:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    res.json({ message: 'Procedure deleted successfully' });
  });
};

// ============================================
// IMMUNIZATION MANAGEMENT
// ============================================
const addImmunization = (req, res) => {
  const {
    patient_id, patient_name, contact_number, vaccine_type, date_given,
    dose_number, injection_site, healthcare_provider, batch_number,
    manufacturer, next_due_date, notes, adverse_reactions
  } = req.body;

  const sql = `INSERT INTO immunizations 
    (patient_id, patient_name, contact_number, vaccine_type, date_given,
     dose_number, injection_site, healthcare_provider, batch_number,
     manufacturer, next_due_date, notes, adverse_reactions, patient_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered')`;

  const values = [
    patient_id, patient_name, contact_number, vaccine_type, date_given,
    dose_number, injection_site, healthcare_provider, batch_number,
    manufacturer, next_due_date, notes, adverse_reactions
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error adding immunization:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (isValidYYYYMMDD(next_due_date)) {
      ensureDayAvailable(next_due_date, () => {
        const fetchPatientSql = 'SELECT user_id, CONCAT_WS(\' \', first_name, middle_name, last_name) AS full_name, phone FROM patients WHERE id = ?';
        db.query(fetchPatientSql, [patient_id], (lookupErr, rows) => {
          if (lookupErr || !rows || rows.length === 0) {
            return res.json({ message: 'Immunization added successfully', id: result.insertId });
          }
          const resolvedUserId = rows[0].user_id || null;
          const resolvedPatientName = rows[0].full_name || '';
          const resolvedContactNumber = rows[0].phone || null;
          const serviceName = 'Immunizations';
          const svcSql = `SELECT duration FROM services WHERE name = ? LIMIT 1`;
          db.query(svcSql, [serviceName], (svcErr, svcRows) => {
            const duration = (svcRows && svcRows[0] && svcRows[0].duration) ? svcRows[0].duration : 30;
            const requiredSlots = getRequiredSlotsForDuration(duration);
            let idx = 0;
            const tryNext = () => {
              if (idx >= SLOT_SEQUENCE.length) return res.json({ message: 'Immunization added successfully', id: result.insertId, auto_scheduled_followup_booking_id: null });
              const baseSlot = SLOT_SEQUENCE[idx];
              const consecutiveSlots = getConsecutiveSlots(baseSlot, requiredSlots);
              if (!consecutiveSlots || consecutiveSlots.length < requiredSlots) { idx += 1; return tryNext(); }
              const placeholders = consecutiveSlots.map(() => '?').join(',');
              const conflictSql = `SELECT COUNT(*) AS cnt FROM booking WHERE date = ? AND time_slot IN (${placeholders}) AND (appointment_status IS NULL OR appointment_status != 'cancelled') AND (request_status IS NULL OR request_status != 'declined')`;
              db.query(conflictSql, [next_due_date, ...consecutiveSlots], (confErr, confRows) => {
                if (confErr) { idx += 1; return tryNext(); }
                const hasConflict = confRows && confRows[0] && Number(confRows[0].cnt) > 0;
                if (hasConflict) { idx += 1; return tryNext(); }
                const insertSql = `
                  INSERT INTO booking (user_id, patient_name, contact_number, service_type, date, time_slot, request_status, appointment_status, follow_up_of_booking_id, follow_up_due_on)
                  VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, NULL, ?)
                `;
                db.query(insertSql, [resolvedUserId, resolvedPatientName, resolvedContactNumber, serviceName, next_due_date, baseSlot, next_due_date], (insErr, insRes) => {
                  if (insErr) { idx += 1; return tryNext(); }
                  const newId = insRes.insertId;
                  const link = buildAutoBookingLink(serviceName, newId, next_due_date);
                  return res.json({ message: 'Immunization added successfully', id: result.insertId, auto_scheduled_followup_booking_id: newId, auto_booking_link: link });
                });
              });
            };
            tryNext();
          });
        });
      });
    } else {
      res.json({ message: 'Immunization added successfully', id: result.insertId });
    }
  });
};

const getImmunizations = (req, res) => {
  const { patient_id } = req.params;

  const sql = `SELECT * FROM immunizations WHERE patient_id = ? AND patient_type = 'registered' ORDER BY date_given DESC`;

  db.query(sql, [patient_id], (err, results) => {
    if (err) {
      console.error('Error fetching immunizations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

const deleteImmunization = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM immunizations WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting immunization:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Immunization not found' });
    }
    
    res.json({ message: 'Immunization deleted successfully' });
  });
};

// Functions to handle data from medical notes completion
const addFamilyPlanningFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, method_type, method_details, counseling_notes, follow_up_date, appointment_date } = data;
  
  const sql = `INSERT INTO family_planning (patient_id, booking_id, method_type, method_details, counseling_notes, follow_up_date, visit_date) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [patient_id, booking_id, method_type, method_details, counseling_notes, follow_up_date, appointment_date], callback);
};

const addLabResultFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, test_type, test_category, test_date, result_value, unit, reference_range, interpretation, notes, appointment_date } = data;
  const normalRange = reference_range || null;
  const sql = `INSERT INTO lab_results (patient_id, booking_id, test_type, test_category, test_date, result_value, normal_range, unit, interpretation, notes, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [patient_id, booking_id, test_type, test_category, test_date, result_value, normalRange, unit, interpretation, notes, appointment_date], callback);
};

const addPrenatalScheduleFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, gestational_age, prenatal_findings, next_visit_date, appointment_date } = data;
  
  // Validation: patient_id is required for prenatal schedule
  if (!patient_id) {
    console.error('Cannot create prenatal schedule: patient_id is missing');
    return callback(new Error('patient_id is required for prenatal schedule'));
  }
  
  resolvePregnancyIdForDate(patient_id, appointment_date, (err, pid) => {
    if (err) {
      console.error('Error resolving pregnancy_id:', err);
      return callback(err);
    }
    
    const sql = `INSERT INTO prenatal_schedule (patient_id, booking_id, pregnancy_id, gestational_age, visit_notes, next_visit_date, visit_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [patient_id, booking_id, pid, gestational_age, prenatal_findings, next_visit_date, appointment_date], (insertErr, result) => {
      if (insertErr) {
        console.error('Error inserting prenatal schedule:', insertErr);
        return callback(insertErr);
      }
      callback(null, result);
    });
  });
};

const addPostpartumAssessmentFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, postpartum_findings, recovery_status, next_visit_plan, appointment_date } = data;
  
  const sql = `INSERT INTO postpartum_care (patient_id, booking_id, assessment_notes, recovery_status, follow_up_plan, assessment_date) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [patient_id, booking_id, postpartum_findings, recovery_status, next_visit_plan, appointment_date], callback);
};

const addScreeningFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, screening_type, screening_results, recommendations, appointment_date } = data;
  
  const sql = `INSERT INTO screenings (patient_id, booking_id, screening_type, results, recommendations, screening_date) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [patient_id, booking_id, screening_type, screening_results, recommendations, appointment_date], callback);
};

const addProcedureFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, procedure_type, procedure_performed, procedure_notes, appointment_date } = data;
  
  const sql = `INSERT INTO procedures (patient_id, booking_id, procedure_type, procedure_details, notes, procedure_date) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [patient_id, booking_id, procedure_type, procedure_performed, procedure_notes, appointment_date], callback);
};

const addImmunizationFromMedicalNotes = (data, callback) => {
  const { patient_id, booking_id, vaccines_given, vaccine_batch, next_dose_date, appointment_date } = data;
  const sql = `INSERT INTO immunizations (patient_id, booking_id, vaccine_type, batch_number, next_due_date, date_given) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [patient_id, booking_id, vaccines_given, vaccine_batch, next_dose_date, appointment_date], callback);
};

// Patient-specific endpoints
const getMyPrenatalRecords = (req, res) => {
  const user_id = req.user.id;
  getOrCreatePatientIdByUserId(user_id)
    .then((patient_id) => {
      const sql = `
        SELECT 
          ps.*, 
          ps.scheduled_date AS appointment_date,
          '00:00' AS time_slot,
          'Prenatal Visit' AS service_type
        FROM prenatal_schedule ps
        WHERE ps.patient_id = ?
        ORDER BY ps.scheduled_date DESC
      `;
      db.query(sql, [patient_id], (err, results) => {
        if (err) {
          console.error('Error fetching prenatal records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
      });
    })
    .catch((err) => {
      console.error('Auto-link error getMyPrenatalRecords:', err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: status === 404 ? 'Patient not found' : 'Database error' });
    });
};

const getMyPostpartumRecords = (req, res) => {
  const user_id = req.user.id;
  getOrCreatePatientIdByUserId(user_id)
    .then((patient_id) => {
      const sql = `
        SELECT 
          pc.*, 
          pc.assessment_date AS appointment_date,
          '00:00' AS time_slot,
          'Postpartum Care' AS service_type
        FROM postpartum_care pc
        WHERE pc.patient_id = ?
        ORDER BY pc.assessment_date DESC
      `;
      db.query(sql, [patient_id], (err, results) => {
        if (err) {
          console.error('Error fetching postpartum records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
      });
    })
    .catch((err) => {
      console.error('Auto-link error getMyPostpartumRecords:', err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: status === 404 ? 'Patient not found' : 'Database error' });
    });
};

const getMyFamilyPlanningRecords = (req, res) => {
  const user_id = req.user.id;
  getOrCreatePatientIdByUserId(user_id)
    .then((patient_id) => {
      const sql = `
        SELECT 
          fp.*, 
          fp.consultation_date AS appointment_date,
          '00:00' AS time_slot,
          'Family Planning' AS service_type
        FROM family_planning fp
        WHERE fp.patient_id = ?
        ORDER BY fp.consultation_date DESC
      `;
      db.query(sql, [patient_id], (err, results) => {
        if (err) {
          console.error('Error fetching family planning records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
      });
    })
    .catch((err) => {
      console.error('Auto-link error getMyFamilyPlanningRecords:', err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: status === 404 ? 'Patient not found' : 'Database error' });
    });
};

const getMyBabyRecords = (req, res) => {
  const user_id = req.user.id;
  getOrCreatePatientIdByUserId(user_id)
    .then((patient_id) => {
      const sql = `
        SELECT 
          b.*,
          bv.recorded_at,
          bv.weight_kg,
          bv.length_cm,
          bv.head_circumference_cm,
          bv.temperature,
          bv.heart_rate,
          bv.respiratory_rate,
          bv.oxygen_saturation,
          bv.feeding_type,
          bv.blood_pressure,
          bv.urine,
          bv.stool
        FROM babies b
        LEFT JOIN baby_vitals bv ON b.id = bv.baby_id
        WHERE b.mother_patient_id = ?
        ORDER BY b.birth_date DESC, bv.recorded_at DESC
      `;
      db.query(sql, [patient_id], (err, results) => {
        if (err) {
          console.error('Error fetching baby records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
      });
    })
    .catch((err) => {
      console.error('Auto-link error getMyBabyRecords:', err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: status === 404 ? 'Patient not found' : 'Database error' });
    });
};

// Add these functions to the exports
module.exports = {
  // Baby Management
  createBaby,
  getBabiesByMother,
  addBabyVitals,

  // Lab Results
  addLabResult,
  getLabResults,
  deleteLabResult,

  // Prenatal Schedule
  createPrenatalSchedule,
  getPrenatalSchedule,
  completePrenatalVisit,
  updatePrenatalSchedule,
  deletePrenatalSchedule,

  // Postpartum Care
  addPostpartumAssessment,
  getPostpartumAssessments,
  deletePostpartumAssessment,

  // Medical Certificates
  createMedicalCertificate,
  getMedicalCertificates,

  // Family Planning
  addFamilyPlanning,
  getFamilyPlanning,
  updateFamilyPlanning,
  deleteFamilyPlanning,

  // Screenings
  addScreening,
  getScreenings,
  updateScreening,
  deleteScreening,

  // Procedures
  addProcedure,
  getProcedures,
  deleteProcedure,

  // Immunizations
  addImmunization,
  getImmunizations,
  deleteImmunization,

  // Medical Notes Integration Functions
  addFamilyPlanningFromMedicalNotes,
  addLabResultFromMedicalNotes,
  addPrenatalScheduleFromMedicalNotes,
  addPostpartumAssessmentFromMedicalNotes,
  addScreeningFromMedicalNotes,
  addProcedureFromMedicalNotes,
  addImmunizationFromMedicalNotes,

  // Patient-specific endpoints
  getMyPrenatalRecords,
  getMyPostpartumRecords,
  getMyFamilyPlanningRecords,
  getMyBabyRecords,

  // Walk-in Merge
  addReferral,
  getReferrals,
  addReferralReturn,
  addMedicationAdministration,
  getMedicationAdministrationByPatient,
  addBirthPlan,
  getBirthPlan,
  getBirthPlans,
  updateBirthPlan,
  deleteBirthPlan,
  addNewbornAdmission,
  dischargeNewbornAdmission,
  getNewbornAdmissionsByBaby,
};


// Newborn admissions table
function ensureNewbornAdmissionsTable() {
  const sql = `CREATE TABLE IF NOT EXISTS newborn_admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    baby_id INT NOT NULL,
    status ENUM('admitted','discharged') DEFAULT 'admitted',
    date_admitted DATETIME DEFAULT NULL,
    admitting_diagnosis VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    date_discharge DATETIME DEFAULT NULL,
    home_medication TEXT DEFAULT NULL,
    follow_up TEXT DEFAULT NULL,
    screening_date DATETIME DEFAULT NULL,
    screening_filter_card_no VARCHAR(100) DEFAULT NULL,
    vitamin_k_date DATE DEFAULT NULL,
    bcg_date DATE DEFAULT NULL,
    hepb_date DATE DEFAULT NULL,
    discharged_by VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_newborn_baby (baby_id)
  )`;
  db.query(sql, () => {});
}

ensureNewbornAdmissionsTable();

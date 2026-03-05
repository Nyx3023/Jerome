const db = require('../config/db');

function run() {
  db.query(
    "SELECT id, TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) as name, phone FROM patients LIMIT 1",
    (selectErr, rows) => {
      if (selectErr) {
        console.error('Select error:', selectErr);
        process.exit(1);
      }
      if (!rows || rows.length === 0) {
        console.error('No patients found to test with.');
        process.exit(1);
      }

      const p = rows[0];
      const sql = `INSERT INTO screenings (
        patient_id, patient_name, contact_number, screening_type, screening_date,
        gestational_age, birth_weight_kg, screening_method, results, interpretation,
        recommendations, follow_up_required, follow_up_date, status, screened_by,
        reviewed_by, lab_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        p.id,
        p.name || 'Unknown',
        p.phone || null,
        'Blood Panel',
        '2025-11-04',
        null,
        null,
        'Automated',
        'All normal',
        null,
        null,
        false,
        null,
        'completed',
        'Dr Script',
        null,
        'Lab A',
        'Smoke test insert'
      ];

      db.query(sql, values, (insertErr, result) => {
        if (insertErr) {
          console.error('Insert error:', insertErr);
          process.exit(1);
        }
        console.log('Inserted screening id:', result.insertId);
        process.exit(0);
      });
    }
  );
}

run();


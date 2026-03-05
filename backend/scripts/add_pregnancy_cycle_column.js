const db = require('../config/db');

const addColumn = () => {
  const sql = "ALTER TABLE admissions ADD COLUMN pregnancy_cycle VARCHAR(50) DEFAULT NULL AFTER admission_reason";
  
  db.query(sql, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("Column 'pregnancy_cycle' already exists.");
      } else {
        console.error("Error adding column:", err);
      }
    } else {
      console.log("Column 'pregnancy_cycle' added successfully.");
    }
    process.exit();
  });
};

addColumn();

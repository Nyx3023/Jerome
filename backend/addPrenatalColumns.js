const db = require('./config/db');

console.log('Adding prenatal columns to database...\n');

const queries = [
  {
    name: 'Add last_menstrual_period to patients',
    sql: `ALTER TABLE patients ADD COLUMN last_menstrual_period DATE NULL COMMENT 'Last Menstrual Period date for prenatal tracking'`
  },
  {
    name: 'Add expected_delivery_date to patients',
    sql: `ALTER TABLE patients ADD COLUMN expected_delivery_date DATE NULL COMMENT 'Expected Delivery Date (EDD) for pregnant patients'`
  },
  {
    name: 'Add follow_up_provider_type to booking',
    sql: `ALTER TABLE booking ADD COLUMN follow_up_provider_type ENUM('doctor', 'midwife', 'obgyn') NULL DEFAULT 'doctor' COMMENT 'Type of provider for follow-up appointment'`
  }
];

let completed = 0;
let success = 0;
let skipped = 0;

queries.forEach((query, index) => {
  db.query(query.sql, (err, result) => {
    completed++;
    
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        skipped++;
        console.log(`✓ ${query.name} - Already exists (skipped)`);
      } else {
        console.error(`✗ ${query.name} - Error: ${err.message}`);
      }
    } else {
      success++;
      console.log(`✓ ${query.name} - Success`);
    }
    
    if (completed === queries.length) {
      console.log(`\n=================================`);
      console.log(`Migration Complete!`);
      console.log(`Success: ${success}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`Failed: ${completed - success - skipped}`);
      console.log(`=================================\n`);
      
      db.end();
      process.exit(0);
    }
  });
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Migration timed out after 30 seconds');
  db.end();
  process.exit(1);
}, 30000);

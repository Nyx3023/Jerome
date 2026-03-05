const db = require('./config/db');

console.log('Adding indexes for prenatal columns...\n');

const queries = [
  {
    name: 'Index on booking.follow_up_provider_type',
    sql: `ALTER TABLE booking ADD INDEX idx_booking_follow_up_provider (follow_up_provider_type)`
  },
  {
    name: 'Index on patients.last_menstrual_period',
    sql: `ALTER TABLE patients ADD INDEX idx_patients_lmp (last_menstrual_period)`
  },
  {
    name: 'Index on patients.expected_delivery_date',
    sql: `ALTER TABLE patients ADD INDEX idx_patients_edd (expected_delivery_date)`
  }
];

let completed = 0;
let success = 0;
let skipped = 0;

queries.forEach((query, index) => {
  db.query(query.sql, (err, result) => {
    completed++;
    
    if (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
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
      console.log(`Index Migration Complete!`);
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

const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'migrations', 'add_prenatal_indexes.sql');

console.log('Running database migration: add_prenatal_indexes.sql');

// Read the SQL file
const sql = fs.readFileSync(migrationFile, 'utf8');

// Split by semicolon and filter out empty statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let completed = 0;
let errors = 0;

// Execute each statement
statements.forEach((statement, index) => {
  db.query(statement, (err, result) => {
    completed++;
    
    if (err) {
      // Ignore "duplicate key name" errors (index already exists)
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log(`ℹ️  Statement ${index + 1}: Index already exists (skipping)`);
      } else {
        errors++;
        console.error(`\n❌ Error executing statement ${index + 1}:`, err.message);
        console.error('Error code:', err.code);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    } else {
      console.log(`✅ Statement ${index + 1} executed successfully`);
    }

    // Close connection when all done
    if (completed === statements.length) {
      if (errors === 0) {
        console.log('\n✅ Index migration completed successfully!');
      } else {
        console.log(`\n⚠️  Index migration completed with ${errors} error(s)`);
      }
      process.exit(errors > 0 ? 1 : 0);
    }
  });
});

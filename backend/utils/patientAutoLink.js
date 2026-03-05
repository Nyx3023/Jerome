const db = require('../config/db');

// Returns a Promise resolving to patient_id for the given user_id.
// If no patient row exists, it creates a minimal profile from the users table.
const getOrCreatePatientIdByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      const err = new Error('Unauthorized: missing user');
      err.statusCode = 401;
      return reject(err);
    }

    const checkSql = 'SELECT id FROM patients WHERE user_id = ?';
    db.query(checkSql, [userId], (checkErr, rows) => {
      if (checkErr) return reject(checkErr);
      if (rows && rows.length > 0) {
        return resolve(rows[0].id);
      }

      // Fetch user info to construct a minimal patient profile
      const getUserSql = 'SELECT id, email, name FROM users WHERE id = ?';
      db.query(getUserSql, [userId], (userErr, users) => {
        if (userErr) return reject(userErr);
        if (!users || users.length === 0) {
          const err = new Error('User not found');
          err.statusCode = 404;
          return reject(err);
        }

        const u = users[0];
        let firstName = null;
        let middleName = null;
        let lastName = null;

        // Prefer explicit name field if present; otherwise derive from email local part
        if (u.name && String(u.name).trim().length > 0) {
          const tokens = String(u.name).trim().split(/\s+/);
          firstName = tokens[0] || null;
          lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
          middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : null;
        } else {
          const local = (String(u.email || '').split('@')[0] || 'User').trim();
          firstName = local;
          lastName = '';
          middleName = null;
        }

        const insertSql = `
          INSERT INTO patients (user_id, first_name, middle_name, last_name, email, phone, gender)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [u.id, firstName, middleName, lastName, u.email, null, null];
        db.query(insertSql, params, (insErr, result) => {
          if (insErr) return reject(insErr);
          return resolve(result.insertId);
        });
      });
    });
  });
};

module.exports = { getOrCreatePatientIdByUserId };


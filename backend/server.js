const express = require("express");
require('dotenv').config();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

// Import routes (Ensure these paths are correct)
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const staffRoutes = require("./routes/staffRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const clinicRoutes = require("./routes/clinicRoutes");

const app = express();

// Middleware - CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public/uploads directory (for both services and profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads/lab-results', express.static(path.join(__dirname, 'uploads', 'lab-results')));

// Health check endpoint
app.get('/', (req, res) => {
  const db = require('./config/db');
  db.query('SELECT 1', (err) => {
    res.json({
      status: err ? 'error' : 'ok',
      db_connected: !err,
      db_error: err ? err.message : null,
      env_check: {
        DB_HOST: process.env.DB_HOST ? 'set' : 'MISSING',
        DB_PORT: process.env.DB_PORT ? 'set' : 'MISSING',
        DB_USER: process.env.DB_USER ? 'set' : 'MISSING',
        DB_PASS: process.env.DB_PASS ? 'set' : 'MISSING',
        DB_NAME: process.env.DB_NAME ? 'set' : 'MISSING',
        DB_SSL: process.env.DB_SSL || 'MISSING',
        FRONTEND_URL: process.env.FRONTEND_URL || 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING'
      }
    });
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/clinic", clinicRoutes);

const { addClient } = require('./utils/sse')
app.get('/api/queues/stream', (req, res) => {
  addClient(res)
})



const DEFAULT_PORT = Number(process.env.PORT) || 8081;
const start = (p) => {
  const srv = app.listen(p, () => {
    console.log(`Server is running on port ${p}`);
    console.log(`Static files are being served from: ${path.join(__dirname, 'public', 'uploads')}`);
  });
  srv.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      start(p + 1);
    } else {
      throw err;
    }
  });
};
start(DEFAULT_PORT);

const db = require('./config/db');
const ensurePatientColumns = () => {
  const columns = [
    { name: 'religion', def: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'occupation', def: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'place_of_birth', def: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'date_of_birth', def: 'DATE DEFAULT NULL' },
    { name: 'marital_status', def: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'nationality', def: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'ethnicity', def: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'preferred_language', def: 'VARCHAR(100) DEFAULT NULL' }
  ];
  columns.forEach(col => {
    const checkSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' AND COLUMN_NAME = ?`;
    db.query(checkSql, [col.name], (err, rows) => {
      if (err) {
        console.error(`Failed to verify patients.${col.name} column`, err);
        return;
      }
      const exists = rows && rows[0] && Number(rows[0].cnt) > 0;
      if (!exists) {
        db.query(`ALTER TABLE patients ADD COLUMN ${col.name} ${col.def}`, (alterErr) => {
          if (alterErr) {
            console.error(`Failed to add patients.${col.name} column`, alterErr);
          } else {
            console.log(`Added patients.${col.name} column`);
          }
        });
      }
    });
  });
};
ensurePatientColumns();

// Ensure ob_provider_type column exists in booking table
const ensureBookingColumns = () => {
  const columns = [
    { name: 'ob_provider_type', def: "VARCHAR(20) DEFAULT NULL COMMENT 'doctor or midwife for OB bookings'" }
  ];
  columns.forEach(col => {
    const checkSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking' AND COLUMN_NAME = ?`;
    db.query(checkSql, [col.name], (err, rows) => {
      if (err) { console.error(`Failed to verify booking.${col.name} column`, err); return; }
      const exists = rows && rows[0] && Number(rows[0].cnt) > 0;
      if (!exists) {
        db.query(`ALTER TABLE booking ADD COLUMN ${col.name} ${col.def}`, (alterErr) => {
          if (alterErr) { console.error(`Failed to add booking.${col.name} column`, alterErr); }
          else { console.log(`Added booking.${col.name} column`); }
        });
      }
    });
  });
};
ensureBookingColumns();

const db = require("../config/db");

// Get comprehensive dashboard analytics
const getDashboardAnalytics = (req, res) => {
  console.log('Fetching dashboard analytics...');
  
  // Define date ranges
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);
  
  // Multiple queries to get all analytics data
  const queries = {
    // Overview statistics
    totalAppointments: `
      SELECT COUNT(*) as count FROM booking
    `,
    thisMonthAppointments: `
      SELECT COUNT(*) as count FROM booking 
      WHERE DATE_FORMAT(date, '%Y-%m') = '${thisMonth}'
    `,
    lastMonthAppointments: `
      SELECT COUNT(*) as count FROM booking 
      WHERE DATE_FORMAT(date, '%Y-%m') = '${lastMonth}'
    `,
    totalPatients: `
      SELECT COUNT(*) as count FROM patients
    `,
    thisMonthPatients: `
      SELECT COUNT(*) as count FROM patients 
      WHERE DATE_FORMAT(created_at, '%Y-%m') = '${thisMonth}'
    `,
    todayAppointments: `
      SELECT COUNT(*) as count FROM booking 
      WHERE date = '${today}' AND request_status = 'confirmed'
    `,
    pendingApprovals: `
      SELECT COUNT(*) as count FROM booking 
      WHERE request_status = 'pending'
    `,
    averageRating: `
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings 
      FROM appointment_feedback
    `,
    
    // Status distribution
    statusDistribution: `
      SELECT 
        request_status,
        COUNT(*) as count
      FROM booking 
      GROUP BY request_status
    `,
    
    // Appointment status distribution
    appointmentStatusDistribution: `
      SELECT 
        appointment_status,
        COUNT(*) as count
      FROM booking 
      GROUP BY appointment_status
    `,
    
    // Most popular services
    popularServices: `
      SELECT 
        service_type,
        COUNT(*) as count
      FROM booking 
      GROUP BY service_type 
      ORDER BY count DESC 
      LIMIT 10
    `,
    
    // Appointments over time (last 30 days)
    appointmentTrends: `
      SELECT 
        DATE(date) as appointment_date,
        COUNT(*) as count
      FROM booking 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(date)
      ORDER BY appointment_date ASC
    `,
    
    // Peak booking hours
    peakHours: `
      SELECT 
        time_slot,
        COUNT(*) as count
      FROM booking 
      GROUP BY time_slot 
      ORDER BY count DESC
    `,
    
    // Monthly trends (last 6 months)
    monthlyTrends: `
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as appointments,
        COUNT(DISTINCT user_id) as unique_patients
      FROM booking 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `,
    
    // Cancellation analysis
    cancellationStats: `
      SELECT 
        cancelled_by,
        COUNT(*) as count
      FROM booking 
      WHERE appointment_status = 'cancelled'
      GROUP BY cancelled_by
    `,
    
    // Walk-in vs Registered patients
    patientTypes: `
      SELECT 
        CASE 
          WHEN user_id IS NULL OR user_id = 0 THEN 'Walk-in'
          ELSE 'Registered'
        END as patient_type,
        COUNT(*) as count
      FROM booking 
      GROUP BY patient_type
    `,
    
    // Recent activity (last 10 appointments)
    recentActivity: `
      SELECT 
        b.id,
        b.patient_name,
        b.date,
        b.time_slot,
        b.service_type,
        b.request_status,
        b.appointment_status,
        b.created_at
      FROM booking b
      ORDER BY b.created_at DESC
      LIMIT 10
    `
  };

  // Execute all queries
  const results = {};
  const queryNames = Object.keys(queries);
  let completedQueries = 0;

  queryNames.forEach(queryName => {
    db.query(queries[queryName], (err, result) => {
      if (err) {
        console.error(`Error in ${queryName}:`, err);
        results[queryName] = { error: err.message };
      } else {
        results[queryName] = result;
      }
      
      completedQueries++;
      
      // When all queries are complete, send response
      if (completedQueries === queryNames.length) {
        console.log('All analytics queries completed');
        res.json(results);
      }
    });
  });
};

// Get service-specific analytics
const getServiceAnalytics = (req, res) => {
  const serviceQuery = `
    SELECT 
      s.name as service_name,
      s.price,
      s.duration,
      s.status,
      COUNT(b.id) as total_bookings,
      COUNT(CASE WHEN b.appointment_status = 'completed' THEN 1 END) as completed_bookings,
      COUNT(CASE WHEN b.appointment_status = 'cancelled' THEN 1 END) as cancelled_bookings,
      AVG(af.rating) as avg_rating,
      COUNT(af.rating) as total_ratings
    FROM services s
    LEFT JOIN booking b ON s.name = b.service_type
    LEFT JOIN appointment_feedback af ON b.id = af.booking_id
    GROUP BY s.id, s.name, s.price, s.duration, s.status
    ORDER BY total_bookings DESC
  `;

  db.query(serviceQuery, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

// Get patient analytics
const getPatientAnalytics = (req, res) => {
  const patientStatsQuery = `
    SELECT 
      COUNT(DISTINCT p.id) as total_registered_patients,
      COUNT(DISTINCT CASE WHEN b.user_id IS NOT NULL THEN b.user_id END) as active_patients,
      AVG(p.age) as avg_age,
      COUNT(CASE WHEN p.gender = 'female' THEN 1 END) as female_count,
      COUNT(CASE WHEN p.gender = 'male' THEN 1 END) as male_count,
      COUNT(CASE WHEN p.gender = 'other' THEN 1 END) as other_count
    FROM patients p
    LEFT JOIN booking b ON p.user_id = b.user_id
  `;

  db.query(patientStatsQuery, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || {});
  });
};

module.exports = {
  getDashboardAnalytics,
  getServiceAnalytics,
  getPatientAnalytics
};

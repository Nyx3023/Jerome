require('dotenv').config();
const db = require('./config/db');

// Test the exact SQL from getAllAppointments
const sql = `
  SELECT 
    b.id,
    CASE 
      WHEN b.user_id IS NOT NULL AND b.user_id > 0 THEN TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name))
      ELSE b.patient_name
    END AS patient_name,
    b.date,
    b.time_slot,
    b.request_status,
    b.appointment_status,
    b.checked_in_at,
    b.service_type AS session,
    b.user_id,
    b.cancel_reason,
    b.cancel_note,
    b.cancelled_at,
    b.cancelled_by,
    b.decline_reason,
    b.decline_note,
    b.declined_at,
    b.declined_by,
    b.is_ob_booking,
    b.follow_up_of_booking_id,
    b.follow_up_provider_type,
    p.age,
    p.expected_delivery_date,
    p.last_menstrual_period,
    af.rating AS feedback_rating,
    af.comment AS feedback_comment,
    CASE WHEN mn.id IS NOT NULL AND mn.vital_signs IS NOT NULL AND mn.vital_signs <> '' THEN 1 ELSE 0 END AS has_vitals
  FROM booking b
  LEFT JOIN appointment_feedback af ON af.booking_id = b.id
  LEFT JOIN medical_notes mn ON mn.booking_id = b.id
  LEFT JOIN patients p ON p.user_id = b.user_id
  ORDER BY b.date DESC, b.time_slot DESC
  LIMIT 1
`;

console.log('Testing getAllAppointments SQL...');
db.query(sql, (err, results) => {
    if (err) {
        console.error('❌ SQL ERROR:', err.message);
        console.error('Error code:', err.code);
        console.error('SQL state:', err.sqlState);
    } else {
        console.log('✅ SQL works! Returned', results.length, 'rows');
    }
    process.exit(0);
});

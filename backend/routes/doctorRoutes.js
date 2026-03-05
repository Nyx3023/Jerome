const express = require('express');
const router = express.Router();
const { getDoctorAppointments, updateAppointmentStatus, getDoctorStats, getServices, getPatients, getOnlinePatientsByService, scheduleFollowUp, getDoctorProfile, updateDoctorProfile, deleteAppointment } = require('../controllers/doctorControllers');
const adminController = require('../controllers/adminControllers');
const admissionsController = require('../controllers/admissionsController');
const medicalNotesController = require('../controllers/medicalNotesController');
const userController = require('../controllers/userControllers');
const { authMiddleware } = require('../middleware/authMiddleware');

// Restrict to doctor role helper
const requireDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Get all appointments for doctor
router.get('/appointments', authMiddleware, getDoctorAppointments);
// Get appointments by date for doctor
router.get('/appointments-by-date', authMiddleware, requireDoctor, requireDoctor, (req, res) => require('../controllers/doctorControllers').getAppointmentsByDate(req, res));

// Update appointment status
router.put('/updateAppointmentStatus', authMiddleware, updateAppointmentStatus);

// Delete appointment (only completed or cancelled)
router.delete('/appointments/:id', authMiddleware, requireDoctor, deleteAppointment);

// Get doctor dashboard stats
router.get('/stats', authMiddleware, getDoctorStats);
router.get('/recent-activity', authMiddleware, requireDoctor, requireDoctor, (req, res) => require('../controllers/doctorControllers').getDoctorRecentActivity(req, res));

// Get services for doctor view
router.get('/services', authMiddleware, getServices);

// Get patients for doctor view
router.get('/patients', authMiddleware, getPatients);

// Get online patients by service for doctor view
router.get('/service-online-patients', authMiddleware, getOnlinePatientsByService);

// Get current doctor's profile
router.get('/profile', authMiddleware, getDoctorProfile);

// Update current doctor's profile
router.put('/profile', authMiddleware, updateDoctorProfile);

// Schedule a follow-up appointment
router.post('/scheduleFollowUp', authMiddleware, scheduleFollowUp);

// Medical notes routes
router.post('/medical-notes', authMiddleware, medicalNotesController.addMedicalNotes);
router.get('/medical-notes/:booking_id', authMiddleware, medicalNotesController.getMedicalNotesByAppointment);
router.get('/patient-history/:patient_id', authMiddleware, medicalNotesController.getPatientMedicalHistory);

// PDF download routes for doctors (aliases to existing endpoints)
router.get('/medical-record/:booking_id', authMiddleware, medicalNotesController.getMedicalNotesByAppointment);
router.get('/patient-medical-history/:patient_id', authMiddleware, medicalNotesController.getPatientMedicalHistory);

// Doctor calendar/schedule management
router.get('/schedules', authMiddleware, requireDoctor, adminController.getSchedules);
router.get('/day-slot-summary', authMiddleware, requireDoctor, userController.getDaySlotSummary);
router.post('/add-not-available-slot', authMiddleware, requireDoctor, adminController.addNotAvailableSlot);
router.delete('/delete-slot/:id', authMiddleware, requireDoctor, adminController.deleteSlot);
// Time slot block/unblock via adminController
router.post('/block-time-slot', authMiddleware, requireDoctor, adminController.blockTimeSlot);
router.post('/unblock-time-slot', authMiddleware, requireDoctor, adminController.unblockTimeSlot);

// Walk-in medical records access for doctors
router.get('/medical-records/walkin', authMiddleware, medicalNotesController.getWalkInRecords);

// Walk-in patient specific data access for doctors (with query parameters)
router.get('/walkin/babies', authMiddleware, adminController.getWalkInBabies);
router.get('/walkin/lab-results', authMiddleware, adminController.getWalkInLabResults);
router.get('/walkin/prenatal', authMiddleware, adminController.getWalkInPrenatal);
router.get('/walkin/postpartum', authMiddleware, adminController.getWalkInPostpartum);
router.get('/walkin/family-planning', authMiddleware, adminController.getWalkInFamilyPlanning);
router.get('/walkin/screenings', authMiddleware, adminController.getWalkInScreenings);
router.get('/walkin/procedures', authMiddleware, adminController.getWalkInProcedures);
router.get('/walkin/immunizations', authMiddleware, adminController.getWalkInImmunizations);
router.get('/walkin/patient-profile', authMiddleware, adminController.getWalkInPatientProfile);

// Walk-in patient data creation for doctors
router.post('/walkin/family-planning', authMiddleware, adminController.addWalkInFamilyPlanning);
router.post('/walkin/prenatal', authMiddleware, adminController.addWalkInPrenatal);
router.post('/walkin/babies', authMiddleware, adminController.addWalkInBaby);
router.post('/walkin/lab-results', authMiddleware, adminController.addWalkInLabResult);
router.post('/walkin/postpartum', authMiddleware, adminController.addWalkInPostpartum);
router.post('/walkin/immunizations', authMiddleware, adminController.addWalkInImmunization);
// Allow doctors to add walk-in screenings
router.post('/walkin/screenings', authMiddleware, adminController.addWalkInScreening);
// Allow doctors to add walk-in procedures
router.post('/walkin/procedures', authMiddleware, adminController.addWalkInProcedure);

// Allow doctors to update/delete walk-in procedures, immunizations, and screenings
router.put('/walkin/procedures/:id', authMiddleware, adminController.updateWalkInProcedure);
router.delete('/walkin/procedures/:id', authMiddleware, adminController.deleteWalkInProcedure);
router.put('/walkin/immunizations/:id', authMiddleware, adminController.updateWalkInImmunization);
router.delete('/walkin/immunizations/:id', authMiddleware, adminController.deleteWalkInImmunization);
router.put('/walkin/screenings/:id', authMiddleware, adminController.updateWalkInScreening);
router.delete('/walkin/screenings/:id', authMiddleware, adminController.deleteWalkInScreening);

// Admissions access for doctors
router.get('/admissions', authMiddleware, admissionsController.listAdmissions);

module.exports = router;

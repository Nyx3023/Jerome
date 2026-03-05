const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllers');
const medicalNotesController = require('../controllers/medicalNotesController');
const userController = require('../controllers/userControllers');
const { authMiddleware } = require('../middleware/authMiddleware');

// Restrict to staff role helper
const requireStaff = (req, res, next) => {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Staff calendar/schedule management (similar to doctor calendar)
router.get('/schedules', authMiddleware, requireStaff, adminController.getSchedules);
router.get('/day-slot-summary', authMiddleware, requireStaff, userController.getDaySlotSummary);
router.post('/add-not-available-slot', authMiddleware, requireStaff, adminController.addNotAvailableSlot);
router.delete('/delete-slot/:id', authMiddleware, requireStaff, adminController.deleteSlot);
router.post('/add-holiday-slot', authMiddleware, requireStaff, adminController.addHolidaySlot);
// Time slot block/unblock
router.post('/block-time-slot', authMiddleware, requireStaff, adminController.blockTimeSlot);
router.post('/unblock-time-slot', authMiddleware, requireStaff, adminController.unblockTimeSlot);

// Staff appointment management
router.get('/appointments', authMiddleware, requireStaff, adminController.getAllAppointments);
router.get('/appointments-by-date', authMiddleware, requireStaff, adminController.getAppointmentsByDate);
router.get('/blocked-slots', authMiddleware, requireStaff, adminController.getBlockedSlotsByDate);
router.put('/updateRequestStatus', authMiddleware, requireStaff, adminController.updateRequestStatus);
router.put('/updateAppointmentStatus', authMiddleware, requireStaff, adminController.updateAppointmentStatus);
router.delete('/appointments/:id', authMiddleware, requireStaff, adminController.deleteAppointment);

// Staff patient management
router.get('/patients', authMiddleware, requireStaff, adminController.getAllPatients);
router.get('/search-patients', authMiddleware, requireStaff, adminController.searchPatients);

// Staff services
router.get('/services', authMiddleware, requireStaff, adminController.getServices);

// Walk-in direct check-in
router.post('/walkins/checkin', authMiddleware, requireStaff, adminController.addWalkInToQueue);
router.post('/bookings/check-in', authMiddleware, requireStaff, adminController.checkInBooking);
router.post('/bookings/release-no-show', authMiddleware, requireStaff, adminController.releaseNoShow);
router.get('/queues/status', authMiddleware, requireStaff, adminController.getQueueStatus);

// Walk-in patient data management
router.get('/walkin/prenatal', authMiddleware, requireStaff, adminController.getWalkInPrenatal);
router.post('/walkin/prenatal', authMiddleware, requireStaff, adminController.addWalkInPrenatal);

// Medical records access
router.get('/medical-record/:booking_id', authMiddleware, requireStaff, medicalNotesController.getMedicalNotesByAppointment);
router.get('/medical-records/patient/:patient_id', authMiddleware, requireStaff, medicalNotesController.getAdminPatientMedicalHistory);
router.get('/medical-records/walkin', authMiddleware, requireStaff, medicalNotesController.getWalkInRecords);

// Vital signs (triage)
router.post('/vitals', authMiddleware, requireStaff, medicalNotesController.addOrUpdateVitalsByStaff);

module.exports = router;

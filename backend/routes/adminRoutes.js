const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminControllers");
const analyticsController = require("../controllers/analyticsController");
const medicalNotesController = require("../controllers/medicalNotesController");
const admissionsController = require("../controllers/admissionsController");
const upload = require("../config/multer");
const { authMiddleware } = require("../middleware/authMiddleware");

// Require authentication and admin role for all admin routes
router.use(authMiddleware);
const requireRole = (roles) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Allow both admin and staff access to most routes
const requireAdminOrStaff = requireRole(['admin', 'staff']);
const requireAdminOnly = requireRole('admin');
const requireAdminStaffDoctor = requireRole(['admin', 'staff', 'doctor']);

// Schedule routes - Admin and Staff can view, only Admin can modify
router.get("/schedules", requireAdminOrStaff, adminController.getSchedules);
router.post("/add-not-available-slot", requireAdminOnly, adminController.addNotAvailableSlot);
router.delete("/delete-slot/:id", requireAdminOnly, adminController.deleteSlot);
router.post("/add-holiday-slot", requireAdminOnly, adminController.addHolidaySlot);
router.post("/set-day-capacity", requireAdminOnly, adminController.setDayCapacity);
// Time slot blocking/unblocking (admin or staff)
router.post("/block-time-slot", requireAdminOrStaff, adminController.blockTimeSlot);
router.post("/unblock-time-slot", requireAdminOrStaff, adminController.unblockTimeSlot);

// Appointment routes - Admin and Staff can view/manage
router.get("/getAllAppointments", requireAdminOrStaff, adminController.getAllAppointments);
router.put("/updateRequestStatus", requireAdminOrStaff, adminController.updateRequestStatus);
router.put("/updateAppointmentStatus", requireAdminOrStaff, adminController.updateAppointmentStatus);
router.put("/appointments/:id", requireAdminOrStaff, adminController.updateAppointmentDetails);
router.post("/create-walkin", requireAdminOrStaff, adminController.createWalkIn);
router.get("/search-patients", requireAdminOrStaff, adminController.searchPatients);
// Online patients by service
router.get("/service-online-patients", requireAdminOrStaff, adminController.getOnlinePatientsByService);

// Walk-in queue + check-in/no-show
router.post("/walkins/checkin", requireAdminOrStaff, adminController.addWalkInToQueue);
router.post("/bookings/check-in", requireAdminOrStaff, adminController.checkInBooking);
router.post("/bookings/release-no-show", requireAdminOrStaff, adminController.releaseNoShow);
router.get("/queues/status", requireAdminOrStaff, adminController.getQueueStatus);

// Doctor routes - Admin only
router.get("/doctors", requireAdminOnly, adminController.getDoctors);
router.post("/doctors", requireAdminOnly, adminController.addDoctor);
router.put("/doctors/:id", requireAdminOnly, adminController.updateDoctor);
router.delete("/doctors/:id", requireAdminOnly, adminController.deleteDoctor);
router.post("/doctors/:id/credentials", requireAdminOnly, adminController.createDoctorCredentials);

// Staff management routes - Admin only
router.get("/staff", requireAdminOnly, adminController.getStaff);
router.post("/staff", requireAdminOnly, adminController.addStaff);
router.put("/staff/:id", requireAdminOnly, adminController.updateStaff);
router.delete("/staff/:id", requireAdminOnly, adminController.deleteStaff);
router.post("/staff/:id/credentials", requireAdminOnly, adminController.createStaffCredentials);

// User role management - Admin only
router.put("/users/:id/role", requireAdminOnly, adminController.updateUserRole);

// Patient routes - Admin and Staff can view
router.get("/patient-profile/:userId", requireAdminStaffDoctor, adminController.getPatientProfile);
router.get("/patients", requireAdminStaffDoctor, adminController.getAllPatients);
router.post("/patients", requireAdminStaffDoctor, adminController.createPatient);
router.post("/patients/:id/create-account", requireAdminOnly, adminController.createPatientAccount);
// Conversion removed: walk-ins now stored directly in patients table

// Service routes - Admin and Staff can view, Admin can modify
router.get("/services", requireAdminOrStaff, adminController.getServices);
router.get("/appointments-by-date", requireAdminOrStaff, adminController.getAppointmentsByDate);
router.post("/services", requireAdminOnly, upload.single('image'), adminController.addService);
router.put("/services/:id", requireAdminOnly, upload.single('image'), adminController.updateService);
router.delete("/services/:id", requireAdminOnly, adminController.deleteService);

// Analytics routes - Admin and Staff can view
router.get("/analytics/dashboard", requireAdminOrStaff, analyticsController.getDashboardAnalytics);
router.get("/analytics/services", requireAdminOrStaff, analyticsController.getServiceAnalytics);
router.get("/analytics/patients", requireAdminOrStaff, analyticsController.getPatientAnalytics);

// Medical records routes - Admin and Staff can view
router.get("/medical-record/:booking_id", requireAdminStaffDoctor, medicalNotesController.getMedicalNotesByAppointment);
router.get("/medical-records/patient/:patient_id", requireAdminStaffDoctor, medicalNotesController.getAdminPatientMedicalHistory);
router.get("/medical-records/walkin", requireAdminStaffDoctor, medicalNotesController.getWalkInRecords);

// Vital signs (triage) - Admin and Staff can create/update
router.post("/vitals", requireAdminOrStaff, medicalNotesController.addOrUpdateVitalsByStaff);

// Admissions - Admin, Staff, and Doctor CRUD operations
router.post("/admissions", requireAdminStaffDoctor, admissionsController.createAdmission);
router.get("/admissions", requireAdminStaffDoctor, admissionsController.listAdmissions);
router.get("/admissions/:id", requireAdminStaffDoctor, admissionsController.getAdmissionById);
router.get("/admissions/patient/:patient_id", requireAdminStaffDoctor, admissionsController.getAdmissionsByPatient);
router.put("/admissions/:id", requireAdminStaffDoctor, admissionsController.updateAdmission);
router.delete("/admissions/:id", requireAdminStaffDoctor, admissionsController.deleteAdmission);
router.put("/admissions/:id/delivery", requireAdminStaffDoctor, admissionsController.updateDelivery);
router.put("/admissions/:id/discharge", requireAdminStaffDoctor, admissionsController.dischargeAdmission);

// Walk-in patient specific data management routes
router.post("/walkin/prenatal", requireAdminOrStaff, adminController.addWalkInPrenatal);
router.get("/walkin/prenatal", requireAdminOrStaff, adminController.getWalkInPrenatal);
router.get("/walkin/prenatal/:patient_id", requireAdminOrStaff, adminController.getWalkInPrenatal);
router.put("/walkin/prenatal/:id", requireAdminOrStaff, adminController.updateWalkInPrenatal);
router.delete("/walkin/prenatal/:id", requireAdminOrStaff, adminController.deleteWalkInPrenatal);

router.post("/walkin/babies", requireAdminOrStaff, adminController.addWalkInBaby);
router.get("/walkin/babies", requireAdminOrStaff, adminController.getWalkInBabies);
router.get("/walkin/babies/:patient_id", requireAdminOrStaff, adminController.getWalkInBabies);
router.put("/walkin/babies/:id", requireAdminOrStaff, adminController.updateWalkInBaby);
router.delete("/walkin/babies/:id", requireAdminOrStaff, adminController.deleteWalkInBaby);

router.post("/walkin/lab-results", requireAdminOrStaff, adminController.addWalkInLabResult);
router.get("/walkin/lab-results", requireAdminOrStaff, adminController.getWalkInLabResults);
router.get("/walkin/lab-results/:patient_id", requireAdminOrStaff, adminController.getWalkInLabResults);
router.put("/walkin/lab-results/:id", requireAdminOrStaff, adminController.updateWalkInLabResult);
router.delete("/walkin/lab-results/:id", requireAdminOrStaff, adminController.deleteWalkInLabResult);

router.post("/walkin/postpartum", requireAdminOrStaff, adminController.addWalkInPostpartum);
router.get("/walkin/postpartum", requireAdminOrStaff, adminController.getWalkInPostpartum);
router.get("/walkin/postpartum/:patient_id", requireAdminOrStaff, adminController.getWalkInPostpartum);
router.put("/walkin/postpartum/:id", requireAdminOrStaff, adminController.updateWalkInPostpartum);
router.delete("/walkin/postpartum/:id", requireAdminOrStaff, adminController.deleteWalkInPostpartum);

router.post("/walkin/family-planning", requireAdminOrStaff, adminController.addWalkInFamilyPlanning);
router.get("/walkin/family-planning", requireAdminOrStaff, adminController.getWalkInFamilyPlanning);
router.get("/walkin/family-planning/:patient_id", requireAdminOrStaff, adminController.getWalkInFamilyPlanning);
router.put("/walkin/family-planning/:id", requireAdminOrStaff, adminController.updateWalkInFamilyPlanning);
router.delete("/walkin/family-planning/:id", requireAdminOrStaff, adminController.deleteWalkInFamilyPlanning);

// Walk-in Screenings
router.post("/walkin/screenings", requireAdminOrStaff, adminController.addWalkInScreening);
router.get("/walkin/screenings", requireAdminOrStaff, adminController.getWalkInScreenings);
router.get("/walkin/screenings/:patient_name", requireAdminOrStaff, adminController.getWalkInScreenings);
router.put("/walkin/screenings/:id", requireAdminOrStaff, adminController.updateWalkInScreening);
router.delete("/walkin/screenings/:id", requireAdminOrStaff, adminController.deleteWalkInScreening);

// Walk-in Procedures
router.post("/walkin/procedures", requireAdminOrStaff, adminController.addWalkInProcedure);
router.get("/walkin/procedures", requireAdminOrStaff, adminController.getWalkInProcedures);
router.get("/walkin/procedures/:patient_name", requireAdminOrStaff, adminController.getWalkInProcedures);
router.put("/walkin/procedures/:id", requireAdminOrStaff, adminController.updateWalkInProcedure);
router.delete("/walkin/procedures/:id", requireAdminOrStaff, adminController.deleteWalkInProcedure);

// Walk-in Immunizations
router.post("/walkin/immunizations", requireAdminOrStaff, adminController.addWalkInImmunization);
router.get("/walkin/immunizations", requireAdminOrStaff, adminController.getWalkInImmunizations);
router.get("/walkin/immunizations/:patient_name", requireAdminOrStaff, adminController.getWalkInImmunizations);
router.put("/walkin/immunizations/:id", requireAdminOrStaff, adminController.updateWalkInImmunization);
router.delete("/walkin/immunizations/:id", requireAdminOrStaff, adminController.deleteWalkInImmunization);

// Walk-in patient information update
router.put("/walkin-patients/:patient_id", requireAdminOrStaff, adminController.updateWalkInPatient);
router.get("/walkin/patient-profile", requireAdminOrStaff, adminController.getWalkInPatientProfile);

// Registered patient information update
router.put("/patients/:id", requireAdminOrStaff, adminController.updateRegisteredPatient);

module.exports = router;

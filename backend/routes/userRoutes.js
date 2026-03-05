const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers"); // Make sure this file exists!
const medicalNotesController = require("../controllers/medicalNotesController");
const clinicEnhancementsController = require("../controllers/clinicEnhancementsController");
const { authMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Public routes (do NOT require authentication)
router.get("/available-slots", userController.getAvailableSlots);
router.get("/holiday-slots", userController.getHolidaySlots);
router.get("/booked-slots", userController.getBookedSlots);
router.get("/services", userController.getServices);
router.get("/schedules", userController.getSchedules);
router.get("/day-slot-summary", userController.getDaySlotSummary);
router.get("/available-staff", userController.getAvailableStaff);
router.get("/available-counselors", userController.getAvailableCounselors);

// Apply auth middleware to all routes defined BELOW
router.use(authMiddleware);

// Protected routes - require authentication
router.post("/book-appointment", userController.bookAppointment);
router.post("/reschedule-appointment", userController.rescheduleAppointment);
router.post("/cancel-appointment", userController.cancelAppointment);
router.post("/feedback", userController.submitFeedback);
router.post("/report-overdue", userController.reportOverdueAppointments);
router.get("/patient-appointments", userController.getPatientAppointments);
router.get("/patient-profile", userController.getPatientProfile);
router.post("/update-profile", userController.updatePatientProfile);
router.post("/upload-profile-picture", upload.single('profile_picture'), userController.uploadProfilePicture);

// Medical history routes for patients
router.get("/my-medical-history", medicalNotesController.getMyMedicalHistory);
router.get("/my-lab-results", medicalNotesController.getMyLabResults);
router.get("/my-procedures", medicalNotesController.getMyProcedures);
router.get("/my-screenings", medicalNotesController.getMyScreenings);
router.get("/my-immunizations", medicalNotesController.getMyImmunizations);
router.get("/my-prenatal-records", clinicEnhancementsController.getMyPrenatalRecords);
router.get("/my-postpartum-records", clinicEnhancementsController.getMyPostpartumRecords);
router.get("/my-family-planning-records", clinicEnhancementsController.getMyFamilyPlanningRecords);
router.get("/my-baby-records", clinicEnhancementsController.getMyBabyRecords);

module.exports = router;

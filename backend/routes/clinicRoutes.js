const express = require("express");
const router = express.Router();
const clinicController = require("../controllers/clinicEnhancementsController");
const { requireAuth, requireAdminStaffDoctor, requireAdminOrStaff } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// File upload configuration for lab results
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/lab-results/");
  },
  filename: (req, file, cb) => {
    cb(null, `lab-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// ============================================
// BABY RECORDS
// ============================================
router.post("/babies", requireAdminStaffDoctor, clinicController.createBaby);
router.get("/babies/mother/:patient_id", requireAuth, clinicController.getBabiesByMother);
router.post("/babies/vitals", requireAdminStaffDoctor, clinicController.addBabyVitals);
router.post("/babies/admissions", requireAdminStaffDoctor, clinicController.addNewbornAdmission);
router.put("/babies/admissions/:id/discharge", requireAdminStaffDoctor, clinicController.dischargeNewbornAdmission);
router.get("/babies/:baby_id/admissions", requireAuth, clinicController.getNewbornAdmissionsByBaby);

// (High-risk pregnancy routes removed per client request)

// ============================================
// LABORATORY RESULTS
// ============================================
router.post("/lab-results", requireAdminStaffDoctor, upload.single("file"), clinicController.addLabResult);
router.get("/lab-results/:patient_id", requireAuth, clinicController.getLabResults);
router.delete("/lab-results/:id", requireAdminStaffDoctor, clinicController.deleteLabResult);

// ============================================
// PRENATAL TRACKING
// ============================================
router.post("/prenatal-schedule", requireAdminStaffDoctor, clinicController.createPrenatalSchedule);
router.get("/prenatal-schedule/:patient_id", requireAuth, clinicController.getPrenatalSchedule);
router.put("/prenatal-schedule/:id/complete", requireAdminStaffDoctor, clinicController.completePrenatalVisit);
router.put("/prenatal-schedule/:id", requireAdminStaffDoctor, clinicController.updatePrenatalSchedule);
router.delete("/prenatal-schedule/:id", requireAdminStaffDoctor, clinicController.deletePrenatalSchedule);

// ============================================
// POSTPARTUM CARE
// ============================================
router.post("/postpartum-care", requireAdminStaffDoctor, clinicController.addPostpartumAssessment);
router.get("/postpartum-care/:patient_id", requireAuth, clinicController.getPostpartumAssessments);
router.delete("/postpartum-care/:id", requireAdminStaffDoctor, clinicController.deletePostpartumAssessment);

// ============================================
// MEDICAL CERTIFICATES
// ============================================
router.post("/medical-certificates", requireAdminStaffDoctor, clinicController.createMedicalCertificate);
router.get("/medical-certificates/:patient_id", requireAuth, clinicController.getMedicalCertificates);

// ============================================
// BILLING REMOVED PER CLIENT REQUEST
// ============================================

// ============================================
// FAMILY PLANNING
// ============================================
router.post("/family-planning", requireAdminStaffDoctor, clinicController.addFamilyPlanning);
router.get("/family-planning/:patient_id", requireAuth, clinicController.getFamilyPlanning);
router.put("/family-planning/:id", requireAdminStaffDoctor, clinicController.updateFamilyPlanning);
router.delete("/family-planning/:id", requireAdminStaffDoctor, clinicController.deleteFamilyPlanning);

// ============================================
// SCREENINGS
// ============================================
router.post("/screenings", requireAdminStaffDoctor, clinicController.addScreening);
router.get("/screenings/:patient_id", requireAuth, clinicController.getScreenings);
router.put("/screenings/:id", requireAdminStaffDoctor, clinicController.updateScreening);
router.delete("/screenings/:id", requireAdminStaffDoctor, clinicController.deleteScreening);

// ============================================
// PROCEDURES
// ============================================
router.post("/procedures", requireAdminStaffDoctor, clinicController.addProcedure);
router.get("/procedures/:patient_id", requireAuth, clinicController.getProcedures);
router.delete("/procedures/:id", requireAdminStaffDoctor, clinicController.deleteProcedure);

// ============================================
// IMMUNIZATIONS
// ============================================
router.post("/immunizations", requireAdminStaffDoctor, clinicController.addImmunization);
router.get("/immunizations/:patient_id", requireAuth, clinicController.getImmunizations);
router.delete("/immunizations/:id", requireAdminStaffDoctor, clinicController.deleteImmunization);

// Walk-in merge endpoint removed per client request

// Referrals
router.post("/referrals", requireAdminStaffDoctor, clinicController.addReferral);
router.get("/referrals/:patient_id", requireAuth, clinicController.getReferrals);
router.post("/referrals/:id/return", requireAdminStaffDoctor, clinicController.addReferralReturn);

// Medication Administration
router.post("/medication-administration", requireAdminStaffDoctor, clinicController.addMedicationAdministration);
router.get("/medication-administration/:patient_id", requireAuth, clinicController.getMedicationAdministrationByPatient);

// Birth Plan
router.post("/birth-plan", requireAdminStaffDoctor, clinicController.addBirthPlan);
router.get("/birth-plan/:patient_id", requireAuth, clinicController.getBirthPlan);
router.get("/birth-plans/:patient_id", requireAuth, clinicController.getBirthPlans);
router.put("/birth-plan/:id", requireAdminStaffDoctor, clinicController.updateBirthPlan);
router.delete("/birth-plan/:id", requireAdminStaffDoctor, clinicController.deleteBirthPlan);

module.exports = router;

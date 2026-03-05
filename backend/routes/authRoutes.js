const express = require('express');
const authController = require('../controllers/authController'); // Ensure this path is correct
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', authController.signup);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post('/change-password', authMiddleware, authController.changePassword);
router.put('/update-license-number', authMiddleware, authController.updateLicenseNumber);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router; // ✅ This should be at the bottom

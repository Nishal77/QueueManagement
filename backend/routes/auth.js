import express from 'express';
import {
  sendOTPForVerification,
  verifyOTPAndRegister,
  resendOTP,
  getPatientProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send OTP for verification
router.post('/send-otp', sendOTPForVerification);

// Verify OTP and complete registration
router.post('/verify-otp', verifyOTPAndRegister);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Get patient profile (protected route)
router.get('/profile', authenticateToken, getPatientProfile);

export default router;

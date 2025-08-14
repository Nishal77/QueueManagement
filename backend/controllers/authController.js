import Patient from '../models/Patient.js';
import { sendOTP, verifyOTP, createOTPData } from '../services/otpService.js';
import jwt from 'jsonwebtoken';

// Send OTP for phone number verification
export const sendOTPForVerification = async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    console.log(`\n📞 OTP Request Received:`);
    console.log(`👤 Name: ${name}`);
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`📅 Time: ${new Date().toLocaleString()}\n`);

    // Validate input
    if (!name || !phoneNumber) {
      console.log(`❌ Validation failed: Missing ${!name ? 'name' : 'phoneNumber'}`);
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    // Validate phone number format (10 digits)
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      console.log(`❌ Phone validation failed: ${phoneNumber} (not 10 digits)`);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    // Check if patient already exists
    let patient = await Patient.findOne({ phoneNumber });

    if (patient) {
      console.log(`👥 Existing patient found: ${patient.name} (${patient.phoneNumber})`);
      // Update existing patient's OTP
      const otpData = createOTPData();
      patient.otp = otpData;
      patient.name = name; // Update name in case it changed
      await patient.save();
      console.log(`✅ Updated OTP for existing patient`);
    } else {
      console.log(`🆕 Creating new patient: ${name} (${phoneNumber})`);
      // Create new patient
      const otpData = createOTPData();
      patient = new Patient({
        name,
        phoneNumber,
        otp: otpData
      });
      await patient.save();
      console.log(`✅ New patient created successfully`);
    }

    // Send OTP
    console.log(`📤 Sending OTP to ${phoneNumber}...`);
    const otpResult = await sendOTP(phoneNumber, patient.otp.code);

    if (otpResult.success) {
      console.log(`✅ OTP sent successfully to ${phoneNumber}`);
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        phoneNumber: phoneNumber
      });
    } else {
      console.log(`❌ OTP sending failed: ${otpResult.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: otpResult.message
      });
    }
  } catch (error) {
    console.error('Error in sendOTPForVerification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify OTP and complete patient registration
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { phoneNumber, otp, age, gender } = req.body;

    // Validate input
    if (!phoneNumber || !otp || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, OTP, age, and gender are required'
      });
    }

    // Find patient
    const patient = await Patient.findOne({ phoneNumber });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Please request OTP first.'
      });
    }

    // Verify OTP
    const otpVerification = verifyOTP(
      patient.otp.code,
      patient.otp.expiresAt,
      otp
    );

    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.message
      });
    }

    // Update patient with additional information
    patient.age = age;
    patient.gender = gender;
    patient.isVerified = true;
    patient.otp = undefined; // Clear OTP after successful verification

    await patient.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        patientId: patient._id,
        phoneNumber: patient.phoneNumber,
        role: 'patient'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        age: patient.age,
        gender: patient.gender,
        isVerified: patient.isVerified
      }
    });
  } catch (error) {
    console.error('Error in verifyOTPAndRegister:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const patient = await Patient.findOne({ phoneNumber });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Please register first.'
      });
    }

    // Generate new OTP
    const otpData = createOTPData();
    patient.otp = otpData;
    await patient.save();

    // Send new OTP
    const otpResult = await sendOTP(phoneNumber, patient.otp.code);

    if (otpResult.success) {
      res.status(200).json({
        success: true,
        message: 'OTP resent successfully',
        phoneNumber: phoneNumber
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
        error: otpResult.message
      });
    }
  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get patient profile
export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patientId).select('-otp');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('Error in getPatientProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

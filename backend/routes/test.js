import express from 'express';
import { sendOTP } from '../services/otpService.js';
import config from '../config/config.js';

const router = express.Router();

// Test Twilio SMS functionality
router.post('/test-sms', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate a test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`\n🧪 TEST SMS REQUEST:`);
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`🔐 Test OTP: ${testOTP}\n`);
    
    const result = await sendOTP(phoneNumber, testOTP);
    
    res.status(200).json({
      success: true,
      message: 'SMS test completed',
      result,
      testOTP: config.nodeEnv === 'development' ? testOTP : undefined,
      config: {
        nodeEnv: config.nodeEnv,
        twilioConfigured: !!(config.twilio.accountSid && config.twilio.authToken),
        accountSidFormat: config.twilio.accountSid ? 
          (config.twilio.accountSid.startsWith('AC') ? 'Valid (AC...)' : 'Invalid (not AC...)') : 
          'Not configured'
      }
    });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Test SMS failed',
      error: error.message
    });
  }
});

// Test Twilio configuration
router.get('/test-twilio-config', (req, res) => {
  res.json({
    success: true,
    nodeEnv: config.nodeEnv,
    twilioConfigured: !!(config.twilio.accountSid && config.twilio.authToken),
    accountSid: config.twilio.accountSid ? 
      (config.twilio.accountSid.startsWith('AC') ? 'Valid (AC...)' : 'Invalid (not AC...)') : 
      'Not configured',
    authToken: config.twilio.authToken ? 'Configured' : 'Not configured',
    phoneNumber: config.twilio.phoneNumber || 'Not configured',
    message: config.nodeEnv === 'development' ? 
      'In development mode, OTPs are logged to console regardless of Twilio config' : 
      'In production mode, Twilio must be properly configured'
  });
});

export default router;

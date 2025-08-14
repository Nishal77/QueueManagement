import twilio from 'twilio';
import config from '../config/config.js';
import { formatPhoneNumberForSMS } from '../utils/phoneUtils.js';

// Initialize Twilio client only if credentials are available
let twilioClient = null;
if (config.twilio.accountSid && config.twilio.authToken) {
  // Check if Account SID is valid (should start with AC)
  if (config.twilio.accountSid.startsWith('AC')) {
    twilioClient = twilio(
      config.twilio.accountSid,
      config.twilio.authToken
    );
  } else {
    console.warn('⚠️  Invalid Twilio Account SID format. Account SID should start with "AC"');
    console.warn('📝 You might have provided a Verification Service SID instead of Account SID');
  }
}

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS using Twilio
export const sendOTP = async (phoneNumber, otp) => {
  try {
    // For development/testing, log the OTP prominently
    if (config.nodeEnv === 'development') {
      console.log('\n' + '='.repeat(60));
      console.log(`🚨 DEVELOPMENT MODE - OTP LOGGING 🚨`);
      console.log(`📱 Phone Number: ${phoneNumber}`);
      console.log(`🔐 OTP Code: ${otp}`);
      console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`);
      console.log(`🔗 Twilio Status: ${twilioClient ? '✅ Configured' : '❌ Not Configured'}`);
      console.log('='.repeat(60) + '\n');
      
      // If Twilio is configured, try to send SMS
      if (twilioClient) {
        try {
          const formattedPhone = formatPhoneNumberForSMS(phoneNumber);
          const message = await twilioClient.messages.create({
            body: `Your QueueManagement verification code is: ${otp}. Valid for 10 minutes.`,
            from: config.twilio.phoneNumber,
            to: formattedPhone
          });
          
          console.log(`✅ SMS sent successfully via Twilio. SID: ${message.sid}`);
          return { success: true, message: 'OTP sent successfully via SMS', sid: message.sid };
        } catch (twilioError) {
          console.error('❌ Twilio SMS failed:', twilioError.message);
          console.log(`📝 OTP logged for development: ${otp}`);
          return { success: true, message: 'OTP logged for development (SMS failed)', error: twilioError.message };
        }
      }
      
      return { success: true, message: 'OTP logged for development' };
    }

    // Production mode - must have Twilio configured
    if (!twilioClient) {
      throw new Error('Twilio not configured for production');
    }

    const formattedPhone = formatPhoneNumberForSMS(phoneNumber);
    const message = await twilioClient.messages.create({
      body: `Your QueueManagement verification code is: ${otp}. Valid for 10 minutes.`,
      from: config.twilio.phoneNumber,
      to: formattedPhone
    });

    return { success: true, message: 'OTP sent successfully', sid: message.sid };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP', error: error.message };
  }
};

// Verify OTP
export const verifyOTP = (storedOTP, storedExpiry, inputOTP) => {
  if (!storedOTP || !storedExpiry || !inputOTP) {
    return { valid: false, message: 'Invalid OTP data' };
  }

  // Check if OTP has expired
  if (new Date() > new Date(storedExpiry)) {
    return { valid: false, message: 'OTP has expired' };
  }

  // Check if OTP matches
  if (storedOTP !== inputOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true, message: 'OTP verified successfully' };
};

// Create OTP data with expiry
export const createOTPData = () => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return {
    code: otp,
    expiresAt: expiresAt
  };
};

export { generateOTP };

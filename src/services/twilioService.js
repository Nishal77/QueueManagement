// Twilio SMS Service for OTP
class TwilioService {
  constructor() {
    this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID
    this.authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN
    this.phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER
    
    console.log('🔧 Twilio Service Initialization:')
    console.log('  Account SID:', this.accountSid ? 'Present' : 'Missing')
    console.log('  Auth Token:', this.authToken ? 'Present' : 'Missing')
    console.log('  Phone Number:', this.phoneNumber ? 'Present' : 'Missing')
    
    // Validate environment variables
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.error('❌ Twilio environment variables missing!')
      console.error('Please check your .env file contains:')
      console.error('VITE_TWILIO_ACCOUNT_SID=your_account_sid')
      console.error('VITE_TWILIO_AUTH_TOKEN=your_auth_token')
      console.error('VITE_TWILIO_PHONE_NUMBER=your_twilio_phone')
      console.error('')
      console.error('Current .env values:')
      console.error('  VITE_TWILIO_ACCOUNT_SID:', this.accountSid)
      console.error('  VITE_TWILIO_AUTH_TOKEN:', this.authToken)
      console.error('  VITE_TWILIO_PHONE_NUMBER:', this.phoneNumber)
    } else {
      console.log('✅ All Twilio environment variables are present!')
    }
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send OTP via Twilio SMS
  async sendOTP(phoneNumber, otp) {
    try {
      // For now, we'll simulate the Twilio API call since we can't make server-side calls from the browser
      // In production, this should be handled by your backend server
      
      console.log('📱 Simulating Twilio SMS (would send in production):')
      console.log('  To:', phoneNumber)
      console.log('  From:', this.phoneNumber)
      console.log('  Message:', `Your OTP is: ${otp}`)
      console.log('  Account SID:', this.accountSid)
      console.log('  Auth Token:', this.authToken ? 'Present' : 'Missing')
      
      // Store OTP in localStorage for verification (temporary solution)
      const otpData = {
        phoneNumber,
        otp,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes expiry
      }
      
      localStorage.setItem(`otp_${phoneNumber}`, JSON.stringify(otpData))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        message: 'OTP sent successfully',
        otp: otp // In production, don't return the OTP
      }
      
    } catch (error) {
      console.error('❌ Error sending OTP:', error)
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      }
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp) {
    try {
      const storedOTPData = localStorage.getItem(`otp_${phoneNumber}`)
      
      if (!storedOTPData) {
        return {
          success: false,
          message: 'No OTP found for this phone number'
        }
      }
      
      const otpData = JSON.parse(storedOTPData)
      
      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        localStorage.removeItem(`otp_${phoneNumber}`)
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        }
      }
      
      // Check if OTP matches
      if (otpData.otp === otp) {
        // Remove OTP after successful verification
        localStorage.removeItem(`otp_${phoneNumber}`)
        
        return {
          success: true,
          message: 'OTP verified successfully'
        }
      } else {
        return {
          success: false,
          message: 'Invalid OTP. Please try again.'
        }
      }
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error)
      return {
        success: false,
        message: 'Error verifying OTP',
        error: error.message
      }
    }
  }

  // Clear expired OTPs
  clearExpiredOTPs() {
    try {
      const keys = Object.keys(localStorage)
      const otpKeys = keys.filter(key => key.startsWith('otp_'))
      
      otpKeys.forEach(key => {
        const otpData = localStorage.getItem(key)
        if (otpData) {
          const data = JSON.parse(otpData)
          if (Date.now() > data.expiresAt) {
            localStorage.removeItem(key)
            console.log('🗑️ Cleared expired OTP for:', data.phoneNumber)
          }
        }
      })
    } catch (error) {
      console.error('❌ Error clearing expired OTPs:', error)
    }
  }
}

// Create singleton instance
const twilioService = new TwilioService()

// Clear expired OTPs every minute
setInterval(() => {
  twilioService.clearExpiredOTPs()
}, 60000)

export default twilioService

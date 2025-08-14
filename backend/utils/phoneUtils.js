// Format phone number for Twilio SMS
export const formatPhoneNumberForSMS = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // If it's a US number (10 digits), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Default: assume Indian number and add +91
  return `+91${cleaned}`;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid 10-digit number
  if (cleaned.length === 10) {
    return true;
  }
  
  // Check if it's a valid number with country code
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return true;
  }
  
  return false;
};

// Extract country code from phone number
export const getCountryCode = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+91'; // India
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return '+1'; // US/Canada
  }
  
  // Default to India
  return '+91';
};

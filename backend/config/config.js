import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/queuemanagement'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    frontendApiBase: process.env.FRONTEND_API_BASE || 'http://localhost:5001/api'
  },
  
  // API Configuration
  api: {
    baseUrl: '/api',
    version: 'v1'
  }
};

export default config;

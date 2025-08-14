import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify patient exists and is verified
    const patient = await Patient.findById(decoded.patientId);
    if (!patient || !patient.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or unverified patient'
      });
    }

    req.patientId = decoded.patientId;
    req.patient = patient;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const patient = await Patient.findById(decoded.patientId);
      
      if (patient && patient.isVerified) {
        req.patientId = decoded.patientId;
        req.patient = patient;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/config.js';

// Import routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import doctorDashboardRoutes from './routes/doctorDashboard.js';
import slotsRoutes from './routes/slots.js';
import testRoutes from './routes/test.js';

// Import database connection
import connectDB from './config/database.js';

// Configuration is loaded from config/config.js

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Common Vite development ports
      const vitePorts = ['5173', '5174', '3000', '5175', '5176'];
      const allowedOrigins = [
        config.cors.origin,
        config.cors.frontendUrl,
        ...vitePorts.map(port => `http://localhost:${port}`),
        ...vitePorts.map(port => `http://127.0.0.1:${port}`)
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Socket.IO CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by Socket.IO CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple Vite dev ports dynamically
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Common Vite development ports
    const vitePorts = ['5173', '5174', '3000', '5175', '5176'];
    const allowedOrigins = [
      config.cors.origin,
      config.cors.frontendUrl,
      ...vitePorts.map(port => `http://localhost:${port}`),
      ...vitePorts.map(port => `http://127.0.0.1:${port}`)
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QueueManagement API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor-dashboard', doctorDashboardRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/test', testRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join doctor room for real-time updates
  socket.on('join-doctor-room', (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    console.log(`Socket ${socket.id} joined doctor room: ${doctorId}`);
  });

  // Join patient room for real-time updates
  socket.on('join-patient-room', (patientId) => {
    socket.join(`patient-${patientId}`);
    console.log(`Socket ${socket.id} joined patient room: ${patientId}`);
  });

  // Handle appointment status updates
  socket.on('appointment-status-updated', (data) => {
    // Broadcast to doctor room
    socket.to(`doctor-${data.doctorId}`).emit('appointment-updated', data);
    
    // Broadcast to patient room
    socket.to(`patient-${data.patientId}`).emit('appointment-updated', data);
  });

  // Handle queue updates
  socket.on('queue-updated', (data) => {
    socket.to(`doctor-${data.doctorId}`).emit('queue-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Make io available to other modules
app.set('io', io);

export { app, server, io };

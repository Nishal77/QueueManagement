import express from 'express';
import {
  bookAppointment,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
  getAvailableSlots,
  getCurrentAppointmentStatus
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Book new appointment
router.post('/book', bookAppointment);

// Get patient's appointments
router.get('/my-appointments', getPatientAppointments);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Cancel appointment
router.patch('/:id/cancel', cancelAppointment);

// Get current appointment status (for live tracking)
router.get('/current/status', getCurrentAppointmentStatus);

export default router;

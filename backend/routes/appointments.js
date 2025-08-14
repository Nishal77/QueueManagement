import express from 'express';
import {
  bookAppointment,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
  getAvailableSlots,
  getCurrentAppointmentStatus,
  getLiveTrackingData,
  getDoctorQueue,
  getAllActiveQueues,
  updateAppointmentStatus,
  getAllAppointments
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/all-queues', getAllActiveQueues);

// All other routes require authentication
router.use(authenticateToken);

// Book new appointment
router.post('/book', bookAppointment);

// Get patient's appointments
router.get('/my-appointments', getPatientAppointments);

// Get all appointments (for doctor dashboard)
router.get('/all', getAllAppointments);

// Get current appointment status (for live tracking)
router.get('/current/status', getCurrentAppointmentStatus);

// Get live tracking data
router.get('/live-tracking/data', getLiveTrackingData);

// Get doctor's queue
router.get('/doctor/:doctorId/queue', getDoctorQueue);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Cancel appointment
router.patch('/:id/cancel', cancelAppointment);

// Update appointment status
router.patch('/:id/status', updateAppointmentStatus);

// Test route to verify routing
router.get('/test-status-update', (req, res) => {
  res.json({ message: 'Status update route is working' });
});

// Debug route to list all available routes
router.get('/debug/routes', (req, res) => {
  const routes = router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods)
    }));
  res.json({ routes });
});

export default router;

import express from 'express';
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  getTodayQueue,
  getDoctorStats,
  getNextPatient
} from '../controllers/doctorDashboardController.js';

const router = express.Router();

// Get all appointments for a doctor
router.get('/:doctorId/appointments', getDoctorAppointments);

// Update appointment status
router.patch('/appointments/:appointmentId/status', updateAppointmentStatus);

// Get today's queue for a doctor
router.get('/:doctorId/queue/today', getTodayQueue);

// Get doctor statistics
router.get('/:doctorId/stats', getDoctorStats);

// Get next patient in queue
router.get('/:doctorId/next-patient', getNextPatient);

export default router;

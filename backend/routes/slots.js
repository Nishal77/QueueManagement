import express from 'express';
import { getAvailableSlots } from '../controllers/appointmentController.js';

const router = express.Router();

// Get available time slots for a doctor (public route)
router.get('/available', getAvailableSlots);

export default router;

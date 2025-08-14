import express from 'express';
import { generateTimeSlots } from '../services/timeSlotService.js';
import Doctor from '../models/Doctor.js';

const router = express.Router();

// Test route to check time slots generation
router.get('/time-slots', (req, res) => {
  try {
    const slots = generateTimeSlots();
    res.json({
      success: true,
      slots: slots,
      count: slots.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test route to check doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    res.json({
      success: true,
      doctors: doctors,
      count: doctors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

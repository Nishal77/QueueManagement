import express from 'express';
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorsBySpecialization,
  toggleDoctorStatus
} from '../controllers/doctorController.js';

const router = express.Router();

// Get all active doctors
router.get('/', getAllDoctors);

// Get doctor by ID
router.get('/:id', getDoctorById);

// Get doctors by specialization
router.get('/specialization/:specialization', getDoctorsBySpecialization);

// Create new doctor (Admin only - add admin middleware later)
router.post('/', createDoctor);

// Update doctor (Admin only)
router.put('/:id', updateDoctor);

// Delete doctor (Admin only)
router.delete('/:id', deleteDoctor);

// Toggle doctor status (Admin only)
router.patch('/:id/toggle-status', toggleDoctorStatus);

export default router;

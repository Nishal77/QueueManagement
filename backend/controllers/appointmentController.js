import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { 
  getAvailableTimeSlots, 
  getNextQueueNumber, 
  calculateEstimatedWaitTime,
  isValidBookingDate 
} from '../services/timeSlotService.js';

// Book new appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot } = req.body;
    const patientId = req.patientId;

    // Validate input
    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, and time slot are required'
      });
    }

    // Check if date is valid for booking
    if (!isValidBookingDate(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date. Please select a date between today and 30 days from now.'
      });
    }

    // Check if patient exists and is verified
    const patient = await Patient.findById(patientId);
    if (!patient || !patient.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found or not verified'
      });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    // Check if time slot is available
    const availableSlots = await getAvailableTimeSlots(doctorId, appointmentDate, Appointment);
    const isSlotAvailable = availableSlots.find(slot => slot.time === timeSlot && slot.available);

    if (!isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available'
      });
    }

    // Check if patient already has an appointment on the same date
    const existingAppointment = await Appointment.findOne({
      patient: patientId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
      },
      status: { $nin: ['cancelled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment on this date'
      });
    }

    // Get next queue number
    const queueNumber = await getNextQueueNumber(doctorId, appointmentDate, Appointment);
    const estimatedWaitTime = calculateEstimatedWaitTime(queueNumber);

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      queueNumber,
      estimatedWaitTime
    });

    await appointment.save();

    // Populate patient and doctor details
    await appointment.populate([
      { path: 'patient', select: 'name age gender phoneNumber' },
      { path: 'doctor', select: 'name specialization' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.patientId;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { patient: patientId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      appointments
    });
  } catch (error) {
    console.error('Error in getPatientAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.patientId;

    const appointment = await Appointment.findOne({
      _id: id,
      patient: patientId
    }).populate([
      { path: 'patient', select: 'name age gender phoneNumber' },
      { path: 'doctor', select: 'name specialization phoneNumber' }
    ]);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error in getAppointmentById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.patientId;

    const appointment = await Appointment.findOne({
      _id: id,
      patient: patientId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Error in cancelAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available time slots for a doctor
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    const availableSlots = await getAvailableTimeSlots(doctorId, date, Appointment);

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        workingHours: doctor.workingHours
      },
      date,
      slots: availableSlots,
      availableSlots: availableSlots
    });
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get current appointment status (for live tracking)
export const getCurrentAppointmentStatus = async (req, res) => {
  try {
    const patientId = req.patientId;

    const currentAppointment = await Appointment.findOne({
      patient: patientId,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lte: new Date().setHours(23, 59, 59, 999)
      },
      status: { $nin: ['cancelled'] }
    })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1 });

    if (!currentAppointment) {
      return res.status(200).json({
        success: true,
        hasAppointment: false,
        message: 'No appointment found for today'
      });
    }

    // Calculate current position in queue
    const queuePosition = await Appointment.countDocuments({
      doctor: currentAppointment.doctor._id,
      appointmentDate: currentAppointment.appointmentDate,
      status: { $nin: ['cancelled'] },
      queueNumber: { $lt: currentAppointment.queueNumber }
    });

    res.status(200).json({
      success: true,
      hasAppointment: true,
      appointment: currentAppointment,
      queuePosition: queuePosition + 1,
      estimatedWaitTime: currentAppointment.estimatedWaitTime
    });
  } catch (error) {
    console.error('Error in getCurrentAppointmentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

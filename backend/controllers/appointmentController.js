import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import LiveTracker from '../models/LiveTracker.js';
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
      // Auto-cancel the existing appointment and create a new one
      existingAppointment.status = 'cancelled';
      await existingAppointment.save();
      
      // Also cancel the corresponding LiveTracker entry
      await LiveTracker.findOneAndUpdate(
        { appointmentId: existingAppointment._id },
        { 
          status: 'cancelled',
          isActive: false,
          endTime: new Date()
        }
      );
      
      console.log(`Cancelled existing appointment for patient ${patientId} on ${appointmentDate}`);
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
    console.log('Appointment created:', appointment._id);

    // Create LiveTracker entry
    const liveTracker = new LiveTracker({
      appointmentId: appointment._id,
      doctorId: doctorId,
      patientId: patientId,
      queueNumber: queueNumber,
      status: 'waiting',
      estimatedWaitTime: estimatedWaitTime,
      startTime: new Date()
    });

    await liveTracker.save();
    console.log('LiveTracker created:', liveTracker._id);

    // Populate patient and doctor details
    await appointment.populate([
      { path: 'patient', select: 'name age gender phoneNumber' },
      { path: 'doctor', select: 'name specialization' }
    ]);

    console.log('Populated appointment:', {
      id: appointment._id,
      patientName: appointment.patient?.name,
      doctorName: appointment.doctor?.name,
      queueNumber: appointment.queueNumber,
      timeSlot: appointment.timeSlot
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
      liveTracker
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
      .populate('patient', 'name age gender phoneNumber')
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

// Cancel appointment (also handles status updates temporarily)
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const patientId = req.patientId;

    // Find appointment (relax patient check for doctor updates)
    let appointment = await Appointment.findById(id);
    
    // If not found by ID, try with patient filter
    if (!appointment && patientId) {
      appointment = await Appointment.findOne({
        _id: id,
        patient: patientId
      });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // If status is provided, update status instead of cancelling
    if (status && ['waiting', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      console.log(`Updating appointment ${id} status to: ${status}`);
      
      appointment.status = status;
      
      // Add additional fields based on status
      if (status === 'in-progress') {
        appointment.startTime = new Date();
      } else if (status === 'completed') {
        appointment.endTime = new Date();
      }

      await appointment.save();

      // Also update the corresponding LiveTracker entry
      await LiveTracker.findOneAndUpdate(
        { appointmentId: appointment._id },
        { 
          status: status,
          isActive: status !== 'completed' && status !== 'cancelled',
          startTime: status === 'in-progress' ? new Date() : undefined,
          endTime: status === 'completed' || status === 'cancelled' ? new Date() : undefined
        },
        { upsert: true, new: true }
      );

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        const updateData = {
          appointmentId: appointment._id,
          status: status,
          doctorId: appointment.doctor,
          patientId: appointment.patient,
          timestamp: new Date().toISOString()
        };

        // Emit directly to rooms
        io.to(`doctor-${appointment.doctor}`).emit('appointment-status-updated', updateData);
        io.to(`patient-${appointment.patient}`).emit('appointment-status-updated', updateData);
        
        // Also emit to all connected clients for testing
        io.emit('appointment-status-updated', updateData);
        
        console.log(`Socket event emitted for appointment ${id}:`, updateData);
        console.log(`Emitted to rooms: doctor-${appointment.doctor}, patient-${appointment.patient}`);
      }

      return res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}`,
        appointment
      });
    }

    // Original cancel logic
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
      .populate('patient', 'name age gender phoneNumber')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1 });

    if (!currentAppointment) {
      return res.status(200).json({
        success: true,
        hasAppointment: false,
        message: 'No appointment found for today'
      });
    }

    // Get live tracking data
    const liveTracker = await LiveTracker.findOne({
      appointmentId: currentAppointment._id,
      isActive: true
    });

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
      liveTracker: liveTracker,
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

// Get live tracking data for a patient
export const getLiveTrackingData = async (req, res) => {
  try {
    const patientId = req.patientId;

    const liveTracker = await LiveTracker.findOne({
      patientId: patientId,
      isActive: true
    })
    .populate('appointmentId', 'appointmentDate timeSlot patientName')
    .populate('patientId', 'name phoneNumber')
    .populate('doctorId', 'name specialization');

    if (!liveTracker) {
      return res.status(200).json({
        success: true,
        hasLiveTracking: false
      });
    }

    res.status(200).json({
      success: true,
      hasLiveTracking: true,
      liveTracker
    });
  } catch (error) {
    console.error('Error in getLiveTrackingData:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get doctor's current queue
export const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get today's appointments for the doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $nin: ['cancelled'] }
    })
    .populate('patient', 'name phoneNumber age gender')
    .populate('doctor', 'name specialization')
    .sort({ queueNumber: 1 })
    .lean();

    // Remove duplicates based on appointment ID
    const uniqueAppointments = appointments.filter((appointment, index, self) => 
      index === self.findIndex(a => a._id.toString() === appointment._id.toString())
    );

    // Transform appointments to queue format
    const queue = uniqueAppointments.map(appointment => ({
      queueNumber: `A${appointment.queueNumber.toString().padStart(2, '0')}`, // Start from 01, 02, 03...
      name: appointment.patient?.name || 'Unknown Patient',
      status: appointment.status,
      estimatedWaitTime: appointment.estimatedWaitTime,
      appointmentId: appointment._id,
      patientId: appointment.patient?._id,
      doctorName: appointment.doctor?.name || 'Unknown Doctor'
    }));

    res.status(200).json({
      success: true,
      queue,
      totalPatients: queue.length,
      doctor: appointments[0]?.doctor || null
    });
  } catch (error) {
    console.error('Error in getDoctorQueue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all appointments (for doctor dashboard)
export const getAllAppointments = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get appointments with pagination
    const appointments = await Appointment.find(query)
      .populate('patient', 'name phoneNumber age gender')
      .populate('doctor', 'name specialization room')
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await Appointment.countDocuments(query);

    console.log(`Found ${appointments.length} appointments out of ${total} total`);

    res.status(200).json({
      success: true,
      appointments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getAllAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all active queues for all doctors
export const getAllActiveQueues = async (req, res) => {
  try {
    // Get today's appointments for all doctors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $nin: ['cancelled'] }
    })
    .populate('patient', 'name phoneNumber age gender')
    .populate('doctor', 'name specialization')
    .sort({ queueNumber: 1 })
    .lean(); // Convert to plain objects for better performance

    // Remove duplicates based on appointment ID
    const uniqueAppointments = appointments.filter((appointment, index, self) => 
      index === self.findIndex(a => a._id.toString() === appointment._id.toString())
    );

    console.log('Found appointments for all queues:', uniqueAppointments.length);
    uniqueAppointments.forEach(apt => {
      console.log('Appointment:', {
        id: apt._id,
        patientName: apt.patient?.name,
        doctorName: apt.doctor?.name,
        queueNumber: apt.queueNumber,
        status: apt.status
      });
    });

    // Transform appointments to queue format
    const queue = uniqueAppointments.map(appointment => ({
      queueNumber: `A${appointment.queueNumber.toString().padStart(2, '0')}`, // Start from 01, 02, 03...
      name: appointment.patient?.name || 'Unknown Patient',
      status: appointment.status,
      estimatedWaitTime: appointment.estimatedWaitTime,
      appointmentId: appointment._id,
      patientId: appointment.patient?._id,
      doctorName: appointment.doctor?.name || 'Unknown Doctor'
    }));

    console.log('All active queues data:', queue);

    res.status(200).json({
      success: true,
      queue,
      totalPatients: queue.length
    });
  } catch (error) {
    console.error('Error in getAllActiveQueues:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    console.log('updateAppointmentStatus called with params:', req.params);
    console.log('updateAppointmentStatus called with body:', req.body);
    
    const { appointmentId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: waiting, in-progress, completed, cancelled'
      });
    }

    // Find and update the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment status
    appointment.status = status;
    
    // Add additional fields based on status
    if (status === 'in-progress') {
      appointment.startTime = new Date();
    } else if (status === 'completed') {
      appointment.endTime = new Date();
    }

    await appointment.save();

    // Also update the corresponding LiveTracker entry
    await LiveTracker.findOneAndUpdate(
      { appointmentId: appointment._id },
      { 
        status: status,
        isActive: status !== 'completed' && status !== 'cancelled',
        startTime: status === 'in-progress' ? new Date() : undefined,
        endTime: status === 'completed' || status === 'cancelled' ? new Date() : undefined
      },
      { upsert: true, new: true }
    );

    // Populate the updated appointment for response
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name phoneNumber age gender')
      .populate('doctor', 'name specialization room');

    console.log(`Appointment ${appointmentId} status updated to: ${status}`);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const updateData = {
        appointmentId: appointment._id,
        status: status,
        doctorId: appointment.doctor,
        patientId: appointment.patient,
        doctorName: updatedAppointment.doctor?.name,
        patientName: updatedAppointment.patient?.name,
        timestamp: new Date().toISOString()
      };

      // Emit to both doctor and patient rooms
      io.to(`doctor-${appointment.doctor}`).emit('appointment-status-updated', updateData);
      io.to(`patient-${appointment.patient}`).emit('appointment-status-updated', updateData);
      
      console.log(`Socket event emitted for appointment ${appointmentId}:`, updateData);
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

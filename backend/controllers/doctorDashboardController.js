import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import moment from 'moment';

// Get all appointments for a doctor (for dashboard)
export const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status, limit = 50, page = 1 } = req.query;

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const query = { doctor: doctorId };
    
    // Filter by date if provided
    if (date) {
      const startOfDay = moment(date).startOf('day');
      const endOfDay = moment(date).endOf('day');
      query.appointmentDate = {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate()
      };
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name age gender phoneNumber')
      .sort({ appointmentDate: 1, queueNumber: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Appointment.countDocuments(query);

    // Get today's statistics
    const today = moment().startOf('day');
    const todayStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          appointmentDate: {
            $gte: today.toDate(),
            $lte: moment().endOf('day').toDate()
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      waiting: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0
    };

    todayStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization
      },
      appointments,
      pagination: {
        count: appointments.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      todayStats: stats
    });
  } catch (error) {
    console.error('Error in getDoctorAppointments:', error);
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
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name age gender phoneNumber')
      .populate('doctor', 'name specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update status and timestamps
    appointment.status = status;
    appointment.notes = notes || appointment.notes;

    if (status === 'in-progress' && !appointment.actualStartTime) {
      appointment.actualStartTime = new Date();
    }

    if (status === 'completed' && !appointment.actualEndTime) {
      appointment.actualEndTime = new Date();
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get today's queue for a doctor
export const getTodayQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = moment().startOf('day');

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: today.toDate(),
        $lte: moment().endOf('day').toDate()
      },
      status: { $nin: ['cancelled'] }
    })
      .populate('patient', 'name age gender phoneNumber')
      .sort({ queueNumber: 1 });

    const doctor = await Doctor.findById(doctorId).select('name specialization');

    res.status(200).json({
      success: true,
      doctor,
      date: today.format('YYYY-MM-DD'),
      queue: appointments,
      totalPatients: appointments.length
    });
  } catch (error) {
    console.error('Error in getTodayQueue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get appointment statistics for a doctor
export const getDoctorStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.appointmentDate = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    } else {
      // Default to last 30 days
      dateFilter.appointmentDate = {
        $gte: moment().subtract(30, 'days').startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      };
    }

    const stats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalWaitTime: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$actualStartTime', null] }, { $ne: ['$actualEndTime', null] }] },
                { $subtract: ['$actualEndTime', '$actualStartTime'] },
                0
              ]
            }
          }
        }
      }
    ]);

    const totalAppointments = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalWaitTime = stats.reduce((sum, stat) => sum + stat.totalWaitTime, 0);
    const averageWaitTime = totalAppointments > 0 ? totalWaitTime / totalAppointments / (1000 * 60) : 0; // in minutes

    const formattedStats = {
      total: totalAppointments,
      waiting: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
      averageWaitTime: Math.round(averageWaitTime)
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats,
      period: {
        startDate: startDate || moment().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: endDate || moment().format('YYYY-MM-DD')
      }
    });
  } catch (error) {
    console.error('Error in getDoctorStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get next patient in queue
export const getNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = moment().startOf('day');

    const nextAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: today.toDate(),
        $lte: moment().endOf('day').toDate()
      },
      status: 'waiting'
    })
      .populate('patient', 'name age gender phoneNumber')
      .sort({ queueNumber: 1 });

    if (!nextAppointment) {
      return res.status(200).json({
        success: true,
        hasNextPatient: false,
        message: 'No more patients in queue'
      });
    }

    res.status(200).json({
      success: true,
      hasNextPatient: true,
      appointment: nextAppointment
    });
  } catch (error) {
    console.error('Error in getNextPatient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

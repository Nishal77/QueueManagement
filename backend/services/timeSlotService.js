import moment from 'moment';

// Generate time slots from 9:00 AM to 12:00 PM in 10-minute intervals
export const generateTimeSlots = (date = new Date()) => {
  const slots = [];
  const startTime = moment(date).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
  const endTime = moment(date).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  let currentTime = moment(startTime);

  while (currentTime.isBefore(endTime)) {
    // Check if the slot is in the past for today
    const isPastSlot = moment().isSame(date, 'day') && moment().isAfter(currentTime);
    
    slots.push({
      time: currentTime.format('HH:mm'),
      displayTime: currentTime.format('h:mm A'),
      available: !isPastSlot
    });
    currentTime.add(10, 'minutes');
  }

  return slots;
};

// Check if a time slot is available for a specific doctor and date
export const checkSlotAvailability = async (doctorId, date, timeSlot, Appointment) => {
  try {
    const startOfDay = moment(date).startOf('day');
    const endOfDay = moment(date).endOf('day');

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate()
      },
      timeSlot: timeSlot,
      status: { $nin: ['cancelled'] }
    });

    return !existingAppointment; // Return true if slot is available
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
};

// Get available time slots for a specific doctor and date
export const getAvailableTimeSlots = async (doctorId, date, Appointment) => {
  try {
    const allSlots = generateTimeSlots(date);
    const startOfDay = moment(date).startOf('day');
    const endOfDay = moment(date).endOf('day');

    // Get booked appointments for the doctor on the given date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate()
      },
      status: { $nin: ['cancelled'] }
    });

    // Create a set of booked time slots for faster lookup
    const bookedSlots = new Set(bookedAppointments.map(apt => apt.timeSlot));

    // Mark unavailable slots
    const availableSlots = allSlots.map(slot => ({
      ...slot,
      available: !bookedSlots.has(slot.time)
    }));

    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return [];
  }
};

// Get next available queue number for a specific doctor and date
export const getNextQueueNumber = async (doctorId, date, Appointment) => {
  try {
    const startOfDay = moment(date).startOf('day');
    const endOfDay = moment(date).endOf('day');

    const lastAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate()
      }
    }).sort({ queueNumber: -1 });

    return lastAppointment ? lastAppointment.queueNumber + 1 : 1;
  } catch (error) {
    console.error('Error getting next queue number:', error);
    return 1;
  }
};

// Calculate estimated wait time based on queue position
export const calculateEstimatedWaitTime = (queueNumber, averageAppointmentDuration = 15) => {
  // Assuming each appointment takes 15 minutes on average
  const waitTime = (queueNumber - 1) * averageAppointmentDuration;
  return Math.max(0, waitTime);
};

// Format time for display
export const formatTime = (time) => {
  return moment(time, 'HH:mm').format('h:mm A');
};

// Check if a date is valid for booking (not in the past, within reasonable future)
export const isValidBookingDate = (date) => {
  const today = moment().startOf('day');
  const bookingDate = moment(date).startOf('day');
  const maxFutureDate = moment().add(30, 'days'); // Allow booking up to 30 days in advance

  return bookingDate.isSameOrAfter(today) && bookingDate.isSameOrBefore(maxFutureDate);
};

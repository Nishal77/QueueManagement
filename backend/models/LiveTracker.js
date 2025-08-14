import mongoose from 'mongoose';

const liveTrackerSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  queueNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  actualWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  // Add indexes for better query performance
  indexes: [
    { doctorId: 1, status: 1 },
    { doctorId: 1, queueNumber: 1 },
    { appointmentId: 1 },
    { patientId: 1 },
    { isActive: 1 }
  ]
});

// Pre-save middleware to update lastUpdated
liveTrackerSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get current queue for a doctor
liveTrackerSchema.statics.getCurrentQueue = async function(doctorId) {
  return await this.find({
    doctorId: doctorId,
    status: { $in: ['waiting', 'in-progress'] },
    isActive: true
  })
  .populate('appointmentId', 'appointmentDate timeSlot patientName')
  .populate('patientId', 'name phoneNumber')
  .populate('doctorId', 'name specialization')
  .sort({ queueNumber: 1 });
};

// Static method to get next patient in queue
liveTrackerSchema.statics.getNextPatient = async function(doctorId) {
  return await this.findOne({
    doctorId: doctorId,
    status: 'waiting',
    isActive: true
  })
  .populate('appointmentId', 'appointmentDate timeSlot patientName')
  .populate('patientId', 'name phoneNumber')
  .populate('doctorId', 'name specialization')
  .sort({ queueNumber: 1 });
};

// Static method to update queue numbers after a patient is removed
liveTrackerSchema.statics.updateQueueNumbers = async function(doctorId, removedQueueNumber) {
  return await this.updateMany(
    {
      doctorId: doctorId,
      queueNumber: { $gt: removedQueueNumber },
      status: 'waiting',
      isActive: true
    },
    {
      $inc: { queueNumber: -1 }
    }
  );
};

// Static method to calculate estimated wait time
liveTrackerSchema.statics.calculateEstimatedWaitTime = async function(doctorId, queueNumber) {
  // Get average consultation time from recent appointments
  const recentAppointments = await this.find({
    doctorId: doctorId,
    status: 'completed',
    endTime: { $exists: true, $ne: null }
  })
  .sort({ endTime: -1 })
  .limit(10);

  if (recentAppointments.length === 0) {
    return queueNumber * 15; // Default 15 minutes per patient
  }

  // Calculate average consultation time
  let totalTime = 0;
  let count = 0;
  
  recentAppointments.forEach(appointment => {
    if (appointment.startTime && appointment.endTime) {
      const duration = (appointment.endTime - appointment.startTime) / (1000 * 60); // Convert to minutes
      totalTime += duration;
      count++;
    }
  });

  const averageConsultationTime = count > 0 ? totalTime / count : 15;
  return Math.round(queueNumber * averageConsultationTime);
};

// Instance method to update status
liveTrackerSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'in-progress') {
    this.startTime = new Date();
  } else if (newStatus === 'completed' || newStatus === 'cancelled') {
    this.endTime = new Date();
    this.isActive = false;
    
    // Calculate actual wait time
    if (this.startTime) {
      this.actualWaitTime = Math.round((this.endTime - this.startTime) / (1000 * 60));
    }
  }
  
  return await this.save();
};

// Instance method to move to next in queue
liveTrackerSchema.methods.moveToNext = async function() {
  if (this.status === 'waiting') {
    this.status = 'in-progress';
    this.startTime = new Date();
    return await this.save();
  }
  return false;
};

// Virtual for current wait time
liveTrackerSchema.virtual('currentWaitTime').get(function() {
  if (this.status === 'waiting' && this.startTime) {
    return Math.round((new Date() - this.startTime) / (1000 * 60));
  }
  return 0;
});

// Ensure virtuals are included when converting to JSON
liveTrackerSchema.set('toJSON', { virtuals: true });
liveTrackerSchema.set('toObject', { virtuals: true });

export default mongoose.model('LiveTracker', liveTrackerSchema);

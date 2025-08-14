import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  queueNumber: {
    type: Number,
    required: true
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
appointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ createdAt: -1 });

// Virtual for formatted appointment time
appointmentSchema.virtual('formattedTime').get(function() {
  return this.timeSlot;
});

// Virtual for appointment duration
appointmentSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  return null;
});

// Ensure virtuals are serialized
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Appointment', appointmentSchema);

import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '13:00'
    }
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
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ createdAt: -1 });

export default mongoose.model('Doctor', doctorSchema);

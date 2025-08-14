import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  age: {
    type: Number,
    required: false,
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    required: false,
    enum: ['male', 'female', 'other']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
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
patientSchema.index({ createdAt: -1 });

// Custom validation: age and gender are required only after verification
patientSchema.pre('save', function(next) {
  if (this.isVerified && (!this.age || !this.gender)) {
    const error = new Error('Age and gender are required for verified patients');
    return next(error);
  }
  next();
});

export default mongoose.model('Patient', patientSchema);

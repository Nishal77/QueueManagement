import Doctor from '../models/Doctor.js';

// Get all active doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .select('name specialization workingHours')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Error in getAllDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id).select('-__v');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Error in getDoctorById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new doctor (Admin only)
export const createDoctor = async (req, res) => {
  try {
    const { name, specialization, phoneNumber, email, workingHours } = req.body;

    // Validate required fields
    if (!name || !specialization || !phoneNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, specialization, phone number, and email are required'
      });
    }

    // Check if doctor already exists with same phone or email
    const existingDoctor = await Doctor.findOne({
      $or: [{ phoneNumber }, { email }]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this phone number or email already exists'
      });
    }

    const doctor = new Doctor({
      name,
      specialization,
      phoneNumber,
      email,
      workingHours: workingHours || { start: '09:00', end: '12:00' }
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        phoneNumber: doctor.phoneNumber,
        email: doctor.email,
        workingHours: doctor.workingHours,
        isActive: doctor.isActive
      }
    });
  } catch (error) {
    console.error('Error in createDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update doctor (Admin only)
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Error in updateDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete doctor (Admin only)
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get doctors by specialization
export const getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;

    const doctors = await Doctor.find({
      specialization: { $regex: specialization, $options: 'i' },
      isActive: true
    })
      .select('name specialization workingHours')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Error in getDoctorsBySpecialization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle doctor active status (Admin only)
export const toggleDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor ${doctor.isActive ? 'activated' : 'deactivated'} successfully`,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        isActive: doctor.isActive
      }
    });
  } catch (error) {
    console.error('Error in toggleDoctorStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

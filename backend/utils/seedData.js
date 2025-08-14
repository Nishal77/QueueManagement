import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import config from '../config/config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDoctors = async () => {
  try {
    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    // Create Indian doctors
    const doctors = [
      {
        name: 'Dr. Rajesh Kumar',
        specialization: 'Cardiology',
        phoneNumber: '9876543210',
        email: 'dr.rajesh.kumar@hospital.com',
        workingHours: {
          start: '09:00',
          end: '12:00'
        },
        isActive: true,
        experience: '15 years',
        qualifications: ['MBBS', 'MD (Cardiology)', 'FSCAI'],
        languages: ['English', 'Hindi', 'Marathi'],
        consultationFee: 1500
      },
      {
        name: 'Dr. Priya Sharma',
        specialization: 'Pediatrics',
        phoneNumber: '9876543211',
        email: 'dr.priya.sharma@hospital.com',
        workingHours: {
          start: '09:00',
          end: '12:00'
        },
        isActive: true,
        experience: '12 years',
        qualifications: ['MBBS', 'MD (Pediatrics)', 'DCH'],
        languages: ['English', 'Hindi', 'Gujarati'],
        consultationFee: 1200
      },
      {
        name: 'Dr. Amit Patel',
        specialization: 'Orthopedics',
        phoneNumber: '9876543212',
        email: 'dr.amit.patel@hospital.com',
        workingHours: {
          start: '09:00',
          end: '12:00'
        },
        isActive: true,
        experience: '18 years',
        qualifications: ['MBBS', 'MS (Orthopedics)', 'Fellowship in Joint Replacement'],
        languages: ['English', 'Hindi', 'Gujarati'],
        consultationFee: 1800
      },
      {
        name: 'Dr. Meera Iyer',
        specialization: 'Dermatology',
        phoneNumber: '9876543213',
        email: 'dr.meera.iyer@hospital.com',
        workingHours: {
          start: '09:00',
          end: '12:00'
        },
        isActive: true,
        experience: '10 years',
        qualifications: ['MBBS', 'MD (Dermatology)', 'Diploma in Cosmetology'],
        languages: ['English', 'Hindi', 'Tamil'],
        consultationFee: 1400
      },
      {
        name: 'Dr. Arjun Singh',
        specialization: 'Neurology',
        phoneNumber: '9876543214',
        email: 'dr.arjun.singh@hospital.com',
        workingHours: {
          start: '09:00',
          end: '12:00'
        },
        isActive: true,
        experience: '20 years',
        qualifications: ['MBBS', 'MD (Neurology)', 'DM (Neurology)', 'Fellowship in Stroke Medicine'],
        languages: ['English', 'Hindi', 'Punjabi'],
        consultationFee: 2000
      }
    ];

    const createdDoctors = await Doctor.insertMany(doctors);
    console.log(`✅ Created ${createdDoctors.length} doctors:`);
    
    createdDoctors.forEach(doctor => {
      console.log(`   - Dr. ${doctor.name} (${doctor.specialization})`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    process.exit(1);
  }
};

// Run the seeding
connectDB().then(() => seedDoctors());

import { supabase } from './supabase.js'

export const testAppointments = async () => {
  try {
    console.log('🧪 Testing appointments data...')
    
    // Check if appointments table exists and has data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(5)
    
    if (appointmentsError) {
      console.error('❌ Error checking appointments:', appointmentsError)
      return false
    }
    
    console.log('📋 Current appointments:', appointments)
    
    // Check if patients table has data
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(5)
    
    if (patientsError) {
      console.error('❌ Error checking patients:', patientsError)
      return false
    }
    
    console.log('👥 Current patients:', patients)
    
    // Check if doctors table has data
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .limit(5)
    
    if (doctorsError) {
      console.error('❌ Error checking doctors:', doctorsError)
      return false
    }
    
    console.log('👨‍⚕️ Current doctors:', doctors)
    
    // If no appointments exist, create a sample appointment
    if (!appointments || appointments.length === 0) {
      console.log('📝 No appointments found, creating sample data...')
      
      // First, ensure we have a doctor
      let doctorId
      if (!doctors || doctors.length === 0) {
        console.log('👨‍⚕️ Creating sample doctor...')
        const { data: newDoctor, error: doctorInsertError } = await supabase
          .from('doctors')
          .insert([{
            name: 'Dr. Sarah Johnson',
            specialization: 'Cardiologist',
            room: '101',
            is_active: true
          }])
          .select()
          .single()
        
        if (doctorInsertError) {
          console.error('❌ Error creating doctor:', doctorInsertError)
          return false
        }
        
        doctorId = newDoctor.id
        console.log('✅ Sample doctor created:', newDoctor)
      } else {
        doctorId = doctors[0].id
      }
      
      // Ensure we have a patient
      let patientId
      if (!patients || patients.length === 0) {
        console.log('👥 Creating sample patient...')
        const { data: newPatient, error: patientInsertError } = await supabase
          .from('patients')
          .insert([{
            name: 'John Doe',
            phone_number: '+1234567890',
            age: 30,
            gender: 'Male',
            is_verified: true
          }])
          .select()
          .single()
        
        if (patientInsertError) {
          console.error('❌ Error creating patient:', patientInsertError)
          return false
        }
        
        patientId = newPatient.id
        console.log('✅ Sample patient created:', newPatient)
      } else {
        patientId = patients[0].id
      }
      
      // Create sample appointment
      console.log('📅 Creating sample appointment...')
      const { data: newAppointment, error: appointmentInsertError } = await supabase
        .from('appointments')
        .insert([{
          doctor_id: doctorId,
          patient_id: patientId,
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '09:00',
          status: 'waiting',
          queue_number: 1,
          estimated_wait_time: 15
        }])
        .select()
        .single()
      
      if (appointmentInsertError) {
        console.error('❌ Error creating appointment:', appointmentInsertError)
        return false
      }
      
      console.log('✅ Sample appointment created:', newAppointment)
    }
    
    console.log('🎉 Appointments test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Error in testAppointments:', error)
    return false
  }
}

// Run the test
testAppointments()

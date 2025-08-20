import { supabase } from './supabase.js'

export const checkCurrentData = async () => {
  try {
    console.log('🔍 Checking current Supabase data...')
    
    // Check doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
    
    if (doctorsError) {
      console.error('❌ Error checking doctors:', doctorsError)
    } else {
      console.log('✅ Doctors found:', doctors?.length || 0)
      console.log('📋 Doctor details:', doctors)
    }
    
    // Check patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
    
    if (patientsError) {
      console.error('❌ Error checking patients:', patientsError)
    } else {
      console.log('✅ Patients found:', patients?.length || 0)
      console.log('📋 Patient details:', patients)
    }
    
    // Check appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          name,
          gender,
          phone_number
        ),
        doctors (
          name,
          specialization,
          room
        )
      `)
    
    if (appointmentsError) {
      console.error('❌ Error checking appointments:', appointmentsError)
    } else {
      console.log('✅ Appointments found:', appointments?.length || 0)
      console.log('📋 Appointment details:', appointments)
    }
    
    // Test the exact query that the dashboard uses
    if (doctors && doctors.length > 0) {
      const firstDoctor = doctors[0]
      console.log('🧪 Testing dashboard query for doctor:', firstDoctor.name)
      
      const { data: testAppointments, error: testError } = await supabase
        .from('appointments')
        .select(`
          id,
          queue_number,
          time_slot,
          status,
          appointment_date,
          estimated_wait_time,
          patients!inner(
            name,
            gender,
            phone_number
          ),
          doctors!inner(
            name,
            specialization,
            room
          )
        `)
        .eq('doctor_id', firstDoctor.id)
        .order('queue_number', { ascending: true })
      
      if (testError) {
        console.error('❌ Dashboard query test failed:', testError)
      } else {
        console.log('✅ Dashboard query test successful:', testAppointments)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error in checkCurrentData:', error)
    return false
  }
}

// Run the check
checkCurrentData()

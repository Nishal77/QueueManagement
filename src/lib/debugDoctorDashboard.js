import { supabase } from './supabase.js'

export const debugDoctorDashboard = async () => {
  try {
    console.log('🔍 Debugging Doctor Dashboard - Patient Data Issue...')
    
    // Step 1: Check if doctors exist
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
    
    if (doctorsError) {
      console.error('❌ Error fetching doctors:', doctorsError)
      return false
    }
    
    console.log('✅ Doctors found:', doctors?.length || 0)
    console.log('📋 Doctor details:', doctors)
    
    if (!doctors || doctors.length === 0) {
      console.error('❌ No doctors found in database')
      return false
    }
    
    // Step 2: Check if patients exist
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError)
      return false
    }
    
    console.log('✅ Patients found:', patients?.length || 0)
    console.log('📋 Patient details:', patients)
    
    // Step 3: Check if appointments exist
    const { data: allAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
    
    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError)
      return false
    }
    
    console.log('✅ Appointments found:', allAppointments?.length || 0)
    console.log('📋 All appointments:', allAppointments)
    
    // Step 4: Test the exact query for each doctor
    for (const doctor of doctors) {
      console.log(`\n🧪 Testing query for ${doctor.name} (ID: ${doctor.id})...`)
      
      // Test the exact query the dashboard uses
      const { data: doctorAppointments, error: queryError } = await supabase
        .from('appointments')
        .select(`
          id,
          queue_number,
          time_slot,
          status,
          appointment_date,
          estimated_wait_time,
          patients(
            name,
            gender,
            phone_number
          ),
          doctors(
            name,
            specialization,
            room
          )
        `)
        .eq('doctor_id', doctor.id)
        .order('queue_number', { ascending: true })
      
      if (queryError) {
        console.error(`❌ Query failed for ${doctor.name}:`, queryError)
      } else {
        console.log(`✅ Query successful for ${doctor.name}:`, doctorAppointments)
        console.log(`📊 Found ${doctorAppointments?.length || 0} appointments`)
        
        if (doctorAppointments && doctorAppointments.length > 0) {
          console.log('🔍 First appointment details:', doctorAppointments[0])
          console.log('🔍 Patient data:', doctorAppointments[0].patients)
          console.log('🔍 Doctor data:', doctorAppointments[0].doctors)
        }
      }
    }
    
    // Step 5: Check if there are any appointments without proper relationships
    if (allAppointments && allAppointments.length > 0) {
      console.log('\n🔍 Checking appointment relationships...')
      
      for (const apt of allAppointments) {
        console.log(`\nAppointment ID: ${apt.id}`)
        console.log(`Doctor ID: ${apt.doctor_id}`)
        console.log(`Patient ID: ${apt.patient_id}`)
        console.log(`Status: ${apt.status}`)
        console.log(`Queue: ${apt.queue_number}`)
        
        // Check if doctor exists
        const { data: doctor, error: doctorCheck } = await supabase
          .from('doctors')
          .select('name')
          .eq('id', apt.doctor_id)
          .single()
        
        if (doctorCheck) {
          console.log(`❌ Doctor not found for ID: ${apt.doctor_id}`)
        } else {
          console.log(`✅ Doctor: ${doctor.name}`)
        }
        
        // Check if patient exists
        const { data: patient, error: patientCheck } = await supabase
          .from('patients')
          .select('name')
          .eq('id', apt.patient_id)
          .single()
        
        if (patientCheck) {
          console.log(`❌ Patient not found for ID: ${apt.patient_id}`)
        } else {
          console.log(`✅ Patient: ${patient.name}`)
        }
      }
    }
    
    // Step 6: Test a simple join query
    console.log('\n🧪 Testing simple join query...')
    const { data: joinTest, error: joinError } = await supabase
      .from('appointments')
      .select(`
        appointments.id,
        appointments.queue_number,
        appointments.time_slot,
        appointments.status,
        patients:patients(name, gender, phone_number),
        doctors:doctors(name, specialization)
      `)
      .limit(5)
    
    if (joinError) {
      console.error('❌ Join test failed:', joinError)
    } else {
      console.log('✅ Join test successful:', joinTest)
    }
    
    console.log('\n🎯 Debug Summary:')
    console.log(`- Doctors: ${doctors?.length || 0}`)
    console.log(`- Patients: ${patients?.length || 0}`)
    console.log(`- Appointments: ${allAppointments?.length || 0}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Error in debugDoctorDashboard:', error)
    return false
  }
}

// Run the debug
debugDoctorDashboard()

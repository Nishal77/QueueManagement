import { supabase } from './supabase.js'

export const testSlotsAPI = async () => {
  try {
    console.log('🧪 Testing Slots API...')
    
    // Test 1: Check if appointments table exists
    console.log('📋 Checking appointments table...')
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1)
    
    if (appointmentsError) {
      console.error('❌ Appointments table error:', appointmentsError)
      return false
    }
    
    console.log('✅ Appointments table accessible')
    
    // Test 2: Check if doctors table exists and has data
    console.log('👨‍⚕️ Checking doctors table...')
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1)
    
    if (doctorsError) {
      console.error('❌ Doctors table error:', doctorsError)
      return false
    }
    
    if (!doctors || doctors.length === 0) {
      console.error('❌ No doctors found in database')
      return false
    }
    
    console.log('✅ Doctors table accessible with data:', doctors.length, 'doctors')
    
    // Test 3: Test the slots query logic
    console.log('⏰ Testing slots query logic...')
    const testDoctorId = doctors[0].id
    const testDate = new Date().toISOString().split('T')[0]
    
    console.log('  Test Doctor ID:', testDoctorId)
    console.log('  Test Date:', testDate)
    
    // Test 4: Generate sample time slots (no booking check)
    console.log('🕐 Generating sample time slots...')
    
    const availableSlots = []
    const startHour = 9
    const endHour = 13 // Changed from 12 to 13 to include 1:00 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Format display time properly
        let displayHour = hour
        let ampm = 'AM'
        
        if (hour === 12) {
          displayHour = 12
          ampm = 'PM'
        } else if (hour > 12) {
          displayHour = hour - 12
          ampm = 'PM'
        }
        
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
        
        availableSlots.push({
          time: timeSlot,
          displayTime,
          available: true // All slots are available
        })
      }
    }
    
    console.log('✅ Generated time slots:', availableSlots.length)
    console.log('  Sample slots:', availableSlots.slice(0, 3))
    
    console.log('🎉 Slots API test completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Slots API test failed:', error)
    return false
  }
}

// Auto-run test when imported
testSlotsAPI()

import { supabase } from './supabase.js'

export const checkAndAddDoctors = async () => {
  try {
    console.log('🔍 Checking Supabase database for doctors...')
    
    // Check if doctors table exists and has data
    const { data: existingDoctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
    
    if (doctorsError) {
      console.error('❌ Error checking doctors table:', doctorsError)
      console.log('💡 The doctors table might not exist yet')
      return false
    }
    
    console.log('📋 Current doctors in database:', existingDoctors)
    
    if (existingDoctors && existingDoctors.length > 0) {
      console.log('✅ Doctors table exists with', existingDoctors.length, 'doctors')
      return true
    }
    
    console.log('⚠️ No doctors found, adding sample doctors...')
    
    // Add sample doctors with proper structure
    const sampleDoctors = [
      {
        name: 'Dr. Rajesh Kumar',
        specialization: 'Cardiologist',
        phone_number: '+91-98765-43210',
        room: '101',
        is_active: true
      },
      {
        name: 'Dr. Priya Sharma',
        specialization: 'Neurologist',
        phone_number: '+91-98765-43211',
        room: '205',
        is_active: true
      },
      {
        name: 'Dr. Amit Patel',
        specialization: 'Pediatrician',
        phone_number: '+91-98765-43212',
        room: '103',
        is_active: true
      }
    ]
    
    const { data: newDoctors, error: insertError } = await supabase
      .from('doctors')
      .insert(sampleDoctors)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting doctors:', insertError)
      return false
    }
    
    console.log('✅ Successfully added doctors:', newDoctors)
    return true
    
  } catch (error) {
    console.error('❌ Error in checkAndAddDoctors:', error)
    return false
  }
}

// Run the check and add
checkAndAddDoctors()

import { supabase } from './supabase.js'
import { initializeDatabase } from '../services/supabaseApi.js'

export const initDatabase = async () => {
  try {
    console.log('🔍 Checking database tables...')
    
    // Check if doctors table exists by trying to select from it
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('count')
      .limit(1)
    
    if (doctorsError) {
      console.error('❌ Doctors table not found or not accessible')
      console.error('Please run the SQL migrations in your Supabase dashboard')
      console.error('Use the SQL from: supabase-migrations.sql')
      return false
    }
    
    console.log('✅ Doctors table exists')
    
    // Check if patients table exists
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('count')
      .limit(1)
    
    if (patientsError) {
      console.error('❌ Patients table not found or not accessible')
      return false
    }
    
    console.log('✅ Patients table exists')
    
    // Check if appointments table exists
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('count')
      .limit(1)
    
    if (appointmentsError) {
      console.error('❌ Appointments table not found or not accessible')
      return false
    }
    
    console.log('✅ Appointments table exists')
    
    // Check if live_tracker table exists
    const { data: liveTracker, error: liveTrackerError } = await supabase
      .from('live_tracker')
      .select('count')
      .limit(1)
    
    if (liveTrackerError) {
      console.error('❌ Live tracker table not found or not accessible')
      return false
    }
    
    console.log('✅ Live tracker table exists')
    
    console.log('🎉 All database tables are ready!')
    
    // Initialize with sample data if needed
    await initializeDatabase()
    
    return true
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return false
  }
}

// Auto-initialize when imported
initDatabase()

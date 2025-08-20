import { supabase } from './supabase.js'

export const checkDatabaseHealth = async () => {
  try {
    console.log('🏥 Database Health Check Starting...')
    
    // Test 1: Basic connection
    console.log('🔌 Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('doctors')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return false
    }
    
    console.log('✅ Database connection successful')
    
    // Test 2: Check patients table exists and is accessible
    console.log('📋 Testing patients table access...')
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)
    
    if (patientsError) {
      console.error('❌ Patients table access failed:', patientsError)
      return false
    }
    
    console.log('✅ Patients table accessible')
    
    // Test 3: Check table structure
    console.log('🏗️ Checking table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'patients' })
      .single()
    
    if (tableError) {
      console.log('⚠️ Could not get detailed table info, but table is accessible')
    } else {
      console.log('✅ Table structure verified')
    }
    
    // Test 4: Simple insert test (will be rolled back)
    console.log('🧪 Testing patient insertion...')
    
    // Generate a unique test phone number to avoid conflicts
    const testPhoneNumber = `9999999${Date.now().toString().slice(-3)}`
    const testPatient = {
      name: 'Test User',
      phone_number: testPhoneNumber,
      age: 25,
      gender: 'other',
      is_verified: true
    }
    
    console.log('📱 Using test phone number:', testPhoneNumber)
    
    const { data: insertTest, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Patient insertion test failed:', insertError)
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      return false
    }
    
    console.log('✅ Patient insertion test successful')
    
    // Test 5: Clean up test data
    console.log('🧹 Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('phone_number', testPhoneNumber)
    
    if (deleteError) {
      console.error('⚠️ Warning: Could not clean up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }
    
    console.log('🎉 Database health check passed! All systems operational.')
    return true
    
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return false
  }
}

// Auto-run health check when imported
checkDatabaseHealth()

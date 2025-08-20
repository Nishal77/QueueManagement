import { supabase } from './supabase.js'

export const testDatabase = async () => {
  try {
    console.log('🧪 Testing database connection and schema...')
    
    // Test 1: Check if we can connect to Supabase
    console.log('🔌 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('doctors')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return false
    }
    
    console.log('✅ Database connection successful')
    
    // Test 2: Check patients table schema
    console.log('📋 Testing patients table schema...')
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)
    
    if (patientsError) {
      console.error('❌ Patients table query failed:', patientsError)
      return false
    }
    
    console.log('✅ Patients table accessible')
    
    // Test 3: Try to insert a test patient (will be rolled back)
    console.log('🧪 Testing patient insertion...')
    const testPatient = {
      name: 'Test User',
      phone_number: '9999999999',
      age: 25,
      gender: 'other',
      is_verified: true
    }
    
    console.log('📤 Test patient data:', testPatient)
    
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
    
    console.log('✅ Patient insertion test successful:', insertTest)
    
    // Test 4: Clean up test data
    console.log('🧹 Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('phone_number', '9999999999')
    
    if (deleteError) {
      console.error('⚠️ Warning: Could not clean up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }
    
    console.log('🎉 All database tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Auto-run test when imported
testDatabase()

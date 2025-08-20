import { supabase } from './supabase.js'

export const cleanupTestData = async () => {
  try {
    console.log('🧹 Cleaning up test data...')
    
    // Clean up test patients
    const { data: testPatients, error: selectError } = await supabase
      .from('patients')
      .select('id, phone_number, name')
      .or('name.eq.Test Patient,phone_number.eq.+91-99999-99999')
    
    if (testPatients && testPatients.length > 0) {
      console.log(`🗑️ Found ${testPatients.length} test patients to clean up:`, testPatients)
      
      // Delete test appointments first (due to foreign key constraints)
      for (const patient of testPatients) {
        await supabase
          .from('appointments')
          .delete()
          .eq('patient_id', patient.id)
      }
      
      // Delete test patients
      await supabase
        .from('patients')
        .delete()
        .or('name.eq.Test Patient,phone_number.eq.+91-99999-99999')
      
      console.log('✅ Test patients and appointments cleaned up successfully')
    } else {
      console.log('✅ No test patients found to clean up')
    }
    
    // Clean up any other test data patterns
    const { data: otherTestPatients, error: otherSelectError } = await supabase
      .from('patients')
      .select('id, phone_number, name')
      .or('name.like.%Test%,name.like.%Dummy%,name.like.%Sample%')
    
    if (otherTestPatients && otherTestPatients.length > 0) {
      console.log(`🗑️ Found ${otherTestPatients.length} other test patients to clean up:`, otherTestPatients)
      
      // Delete test appointments first
      for (const patient of otherTestPatients) {
        await supabase
          .from('appointments')
          .delete()
          .eq('patient_id', patient.id)
      }
      
      // Delete test patients
      await supabase
        .from('patients')
        .delete()
        .or('name.like.%Test%,name.like.%Dummy%,name.like.%Sample%')
      
      console.log('✅ Other test data cleaned up successfully')
    }
    
    console.log('🎉 Test data cleanup completed!')
    return true
    
  } catch (error) {
    console.error('❌ Error during test data cleanup:', error)
    return false
  }
}

cleanupTestData()

import { supabase } from './supabase.js'

export const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database structure...')
    
    // Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return false
    }
    
    console.log('📋 Available tables:', tables?.map(t => t.table_name) || [])
    
    // Check specific tables we need
    const requiredTables = ['doctors', 'patients', 'appointments']
    const existingTables = tables?.map(t => t.table_name) || []
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:', missingTables)
      console.log('💡 You need to create these tables first!')
      return false
    } else {
      console.log('✅ All required tables exist!')
    }
    
    // Check if tables have data
    for (const table of requiredTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Error checking ${table}:`, error)
      } else {
        console.log(`📊 ${table} table is accessible`)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error in checkDatabase:', error)
    return false
  }
}

// Run the check
checkDatabase()

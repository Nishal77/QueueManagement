import { createClient } from '@supabase/supabase-js'

// Debug: Log all environment variables
console.log('🔍 All VITE_ environment variables:')
Object.keys(import.meta.env).forEach(key => {
  if (key.startsWith('VITE_')) {
    console.log(`  ${key}:`, import.meta.env[key])
  }
})

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('🔍 Environment variables check:')
console.log('  VITE_SUPABASE_URL:', supabaseUrl)
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present (length: ' + supabaseAnonKey.length + ')' : 'Missing')

// Check if we're in development and provide helpful error messages
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is missing!')
  console.error('Please check your .env file in the project root')
  console.error('Make sure it contains: VITE_SUPABASE_URL=https://your-project.supabase.co')
  console.error('Current working directory:', window.location.origin)
  throw new Error('VITE_SUPABASE_URL is required. Please check your .env file.')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing!')
  console.error('Please check your .env file in the project root')
  console.error('Make sure it contains: VITE_SUPABASE_ANON_KEY=your_anon_key_here')
  console.error('Current working directory:', window.location.origin)
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please check your .env file.')
}

console.log('✅ Environment variables loaded successfully!')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

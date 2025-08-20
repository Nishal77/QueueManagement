import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './lib/initDatabase.js'
import './lib/testDatabase.js'
import './lib/databaseHealthCheck.js'
import './lib/testSlots.js'
import './lib/cleanupTestData.js'
import './lib/testAppointments.js'
import './lib/checkDatabase.js'
import './lib/checkSupabaseDoctors.js'
import './lib/checkCurrentData.js'
import './lib/debugDoctorDashboard.js'

// Debug environment variables on app start
console.log('🚀 App Starting - Environment Check:')
console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing')
console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
console.log('  VITE_TWILIO_ACCOUNT_SID:', import.meta.env.VITE_TWILIO_ACCOUNT_SID ? 'Present' : 'Missing')
console.log('  VITE_TWILIO_AUTH_TOKEN:', import.meta.env.VITE_TWILIO_AUTH_TOKEN ? 'Present' : 'Missing')
console.log('  VITE_TWILIO_PHONE_NUMBER:', import.meta.env.VITE_TWILIO_PHONE_NUMBER ? 'Present' : 'Missing')

// Components
import Navigation from './components/Navigation'

// Pages
import OTPVerification from './pages/OTPVerification'
import BookingForm from './pages/BookingForm'
import UserDashboard from './pages/UserDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import TestPage from './pages/TestPage'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'

// Protected Dashboard Route
const ProtectedDashboard = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
  }
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen w-full relative">
          {/* Navigation */}
          <Navigation />
          
          {/* Your Content/Components */}
          <div className="relative z-10">
            <Routes>
              {/* Default Route - UserDashboard */}
              <Route path="/" element={<UserDashboard />} />
              
              {/* Public Routes */}
              <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/booking" element={<BookingForm />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/test" element={<TestPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedDashboard><UserDashboard /></ProtectedDashboard>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App

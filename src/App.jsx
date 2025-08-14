import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import './App.css'

// Pages
import LandingPage from './pages/LandingPage'
import OTPVerification from './pages/OTPVerification'
import BookingForm from './pages/BookingForm'
import UserDashboard from './pages/UserDashboard'
import DoctorDashboard from './pages/DoctorDashboard'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

// Components
import LoadingSpinner from './components/LoadingSpinner'

// Protected Route Component
const ProtectedRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (user) {
    return <Navigate to={redirectTo} replace />
  }
  
  return children
}

// Protected Dashboard Route
const ProtectedDashboard = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
            <Router>
          <AuthProvider>
            <SocketProvider>
              <div className="min-h-screen w-full relative">
                {/* Azure Depths */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #010133 100%)",
                  }}
                />
                {/* Your Content/Components */}
                <div className="relative z-10">
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
                    <Route path="/verify-otp" element={<ProtectedRoute><OTPVerification /></ProtectedRoute>} />
                    <Route path="/booking" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedDashboard><UserDashboard /></ProtectedDashboard>} />
                    <Route path="/doctor-dashboard" element={<ProtectedDashboard><DoctorDashboard /></ProtectedDashboard>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </SocketProvider>
          </AuthProvider>
        </Router>
  )
}

export default App

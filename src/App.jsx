import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Pages
import UserDashboard from './pages/UserDashboard'
import DoctorDashboard from './pages/DoctorDashboard'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'





// Protected Dashboard Route
const ProtectedDashboard = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
  }
  
  return children
}

function App() {

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
                    <Route path="/" element={<ProtectedDashboard><UserDashboard /></ProtectedDashboard>} />
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

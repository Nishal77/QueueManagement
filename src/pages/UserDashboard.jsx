import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import BookingForm from './BookingForm'

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [currentAppointment, setCurrentAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchAppointments()
    fetchCurrentStatus()
  }, [user, navigate])

  useEffect(() => {
    if (socket) {
      socket.on('appointment-updated', handleAppointmentUpdate)
      return () => {
        socket.off('appointment-updated', handleAppointmentUpdate)
      }
    }
  }, [socket])

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getMyAppointments()
      setAppointments(response.data.appointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentStatus = async () => {
    try {
      const response = await appointmentsAPI.getCurrentStatus()
      if (response.data.hasAppointment) {
        setCurrentAppointment(response.data.appointment)
      }
    } catch (error) {
      console.error('Error fetching current status:', error)
    }
  }

  const handleAppointmentUpdate = (data) => {
    if (currentAppointment && currentAppointment._id === data.appointmentId) {
      setCurrentAppointment(prev => ({ ...prev, status: data.status }))
    }
    fetchAppointments()
    toast.success('Appointment status updated!')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100'
      case 'in-progress': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Right Book Appointment Button */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          onClick={() => setShowBookingForm(!showBookingForm)}
          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          {showBookingForm ? 'Close Form' : 'Book Appointment'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        
        {/* Text Content Section */}
        <div className="text-center z-20 mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight">
            Welcome to Queue Management
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Experience seamless healthcare appointment booking with real-time queue tracking and instant updates. 
            Book your appointment in seconds and track your status live.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 text-base rounded-lg transition-all duration-200"
          >
            Book Appointment
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBookingForm(false)}
            className="border-2 border-black text-black hover:bg-gray-50 px-6 py-3 text-base rounded-lg transition-all duration-200"
          >
            View History
          </Button>
        </div>

        {/* Geometric Graphic */}
        <div className="relative w-full max-w-3xl mb-12">
          <div className="flex justify-center">
            <div className="relative">
              {/* Main Cube Structure */}
              <div className="w-48 h-48 relative transform rotate-45">
                {/* Front Face */}
                <div className="absolute inset-0 bg-black opacity-20 border-2 border-black"></div>
                {/* Right Face */}
                <div className="absolute inset-0 bg-black opacity-10 border-2 border-black transform rotate-45 origin-left"></div>
                {/* Top Face */}
                <div className="absolute inset-0 bg-black opacity-15 border-2 border-black transform -rotate-45 origin-bottom"></div>
                
                {/* Striped Pattern */}
                <div className="absolute inset-0 flex flex-col">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-black opacity-30"></div>
                  ))}
                </div>
              </div>
              
              {/* Arrow Pointer */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-transparent border-b-black"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form Section */}
        {showBookingForm && (
          <div className="w-full max-w-3xl mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Book Your Appointment</h2>
                <Button
                  onClick={() => setShowBookingForm(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ✕
                </Button>
              </div>
              <BookingForm onBookingSuccess={() => {
                setShowBookingForm(false)
                fetchAppointments()
                fetchCurrentStatus()
              }} />
            </div>
          </div>
        )}

        {/* Current Appointment Section */}
        {currentAppointment && (
          <div className="w-full max-w-3xl mb-8">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Current Appointment</h2>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Dr. {currentAppointment.doctor.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{currentAppointment.doctor.specialization}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentAppointment.status)}`}>
                    {currentAppointment.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2 text-sm">📅</span>
                    <span className="text-gray-700 text-sm">
                      {format(new Date(currentAppointment.appointmentDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2 text-sm">🕐</span>
                    <span className="text-gray-700 text-sm">{currentAppointment.timeSlot}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      Queue #{currentAppointment.queueNumber}
                    </div>
                    <p className="text-xs text-blue-700">
                      Estimated wait time: {currentAppointment.estimatedWaitTime} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments History Section */}
        <div className="w-full max-w-3xl">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Appointment History</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                <span className="ml-2 text-gray-600 text-sm">Loading appointments...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3 text-sm">No appointments found</p>
                {!showBookingForm && (
                  <Button
                    onClick={() => setShowBookingForm(true)}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm rounded-lg transition-all duration-200"
                  >
                    Book Your First Appointment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Dr. {appointment.doctor.name}
                        </h3>
                        <p className="text-gray-600 text-xs">{appointment.doctor.specialization}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('-', ' ').toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2 text-xs">📅</span>
                        <span className="text-gray-700 text-xs">
                          {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2 text-xs">🕐</span>
                        <span className="text-gray-700 text-xs">{appointment.timeSlot}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-blue-600 font-medium text-xs">
                        Queue #{appointment.queueNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard

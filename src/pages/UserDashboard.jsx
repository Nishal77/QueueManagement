import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Stethoscope, Calendar, Clock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import LiveAppointmentTracker from '../components/LiveAppointmentTracker'
import BookingForm from './BookingForm'

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [currentAppointment, setCurrentAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getMyAppointments()
      // Ensure appointments have proper structure and filter out any malformed data
      const validAppointments = (response.data.appointments || []).filter(appointment => 
        appointment && appointment._id && appointment.doctor
      )
      setAppointments(validAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
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

  const handleBookingSuccess = (appointment) => {
    setShowBookingForm(false)
    fetchAppointments()
    fetchCurrentStatus()
    toast.success('Appointment booked successfully!')
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
          className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
            Experience seamless healthcare appointment booking and tracking with real-time queue updates and instant notifications. 
            Book your appointment and track your status live.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-16">
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <BookOpen className="mr-3 w-6 h-6" />
            Book Appointment
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBookingForm(false)}
            className="border-3 border-black text-black hover:bg-black hover:text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            View Status
          </Button>
        </div>

        {/* Current Appointment Section */}
        {currentAppointment && (
          <div className="w-full max-w-4xl mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 shadow-lg">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Current Appointment</h2>
              <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        Dr. {currentAppointment.doctor.name}
                      </h3>
                      <p className="text-gray-600 text-lg">{currentAppointment.doctor.specialization}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(currentAppointment.status)}`}>
                    {currentAppointment.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-lg">📅</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Appointment Date</p>
                      <span className="text-lg font-semibold text-gray-800">
                        {format(new Date(currentAppointment.appointmentDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-lg">🕐</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Time Slot</p>
                      <span className="text-lg font-semibold text-gray-800">{currentAppointment.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      Queue #{currentAppointment.queueNumber}
                    </div>
                    <p className="text-blue-100 text-lg">
                      Estimated wait time: {currentAppointment.estimatedWaitTime} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Appointment Status */}
        <div className="w-full max-w-4xl mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 border border-green-200 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Live Appointment Status</h2>
              <p className="text-gray-600 text-lg">Real-time updates on your appointment</p>
            </div>

            {/* Current Time Display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-800">
                  {format(currentTime, 'HH:mm:ss')}
                </span>
              </div>
            </div>

            {currentAppointment ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                {/* Status Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {currentAppointment.status === 'waiting' && <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />}
                    {currentAppointment.status === 'in-progress' && <AlertCircle className="w-6 h-6 text-blue-600" />}
                    {currentAppointment.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {!['waiting', 'in-progress', 'completed'].includes(currentAppointment.status) && <Clock className="w-6 h-6 text-gray-600" />}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {currentAppointment.status === 'waiting' && 'Waiting in Queue'}
                        {currentAppointment.status === 'in-progress' && 'Currently with Doctor'}
                        {currentAppointment.status === 'completed' && 'Appointment Completed'}
                        {!['waiting', 'in-progress', 'completed'].includes(currentAppointment.status) && 'Scheduled'}
                      </h3>
                      <p className="text-gray-600">Queue #{currentAppointment.queueNumber}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(currentAppointment.status)}`}>
                    {currentAppointment.status?.toUpperCase() || 'SCHEDULED'}
                  </div>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Patient Name</p>
                      <span className="text-sm font-semibold text-gray-800">{currentAppointment.patientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Doctor</p>
                      <span className="text-sm font-semibold text-gray-800">Dr. {currentAppointment.doctor?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Appointment Date</p>
                      <span className="text-sm font-semibold text-gray-800">
                        {format(new Date(currentAppointment.appointmentDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time Slot</p>
                      <span className="text-sm font-semibold text-gray-800">{currentAppointment.timeSlot}</span>
                    </div>
                  </div>
                </div>

                {/* Wait Time Estimation */}
                {currentAppointment.status === 'waiting' && currentAppointment.estimatedWaitTime && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">Estimated Wait Time</p>
                        <p className="text-lg font-bold text-yellow-900">
                          {currentAppointment.estimatedWaitTime} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Bar for Waiting Status */}
                {currentAppointment.status === 'waiting' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Queue Progress</span>
                      <span className="text-sm text-gray-500">Position #{currentAppointment.queueNumber}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, 100 - (currentAppointment.queueNumber * 5))}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Appointment</h3>
                  <p className="text-gray-600 text-lg">You don't have any active appointments at the moment.</p>
                  <p className="text-gray-500 mt-2">Book an appointment to start tracking your queue status.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Appointment Tracker */}
        <div className="w-full mb-8">
          <LiveAppointmentTracker 
            currentUser={currentAppointment ? {
              name: currentAppointment.patientName,
              queueNumber: currentAppointment.queueNumber,
              doctor: currentAppointment.doctor,
              appointmentDate: currentAppointment.appointmentDate,
              timeSlot: currentAppointment.timeSlot,
              estimatedWaitTime: currentAppointment.estimatedWaitTime
            } : null}
            appointments={appointments}
          />
        </div>

      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm onBookingSuccess={handleBookingSuccess} />
      )}
    </div>
  )
}

export default UserDashboard

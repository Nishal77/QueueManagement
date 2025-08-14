import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Stethoscope, Calendar, Clock, User, AlertCircle, CheckCircle, Loader2, Heart } from 'lucide-react'
import { Button } from '../components/ui/button'
import { appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import BookingForm from './BookingForm'
import '../assets/fonts/BricolageGrotesque-Medium.ttf'

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [currentAppointment, setCurrentAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [updatedAppointmentId, setUpdatedAppointmentId] = useState(null)
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
      socket.on('appointment-status-updated', handleAppointmentStatusUpdate)
      return () => {
        socket.off('appointment-updated', handleAppointmentUpdate)
        socket.off('appointment-status-updated', handleAppointmentStatusUpdate)
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
      console.log('Appointments response:', response.data)
      
      // Ensure appointments have proper structure and filter out any malformed data
      const validAppointments = (response.data.appointments || []).filter(appointment => 
        appointment && appointment._id && appointment.doctor
      )
      setAppointments(validAppointments)
      console.log('Valid appointments:', validAppointments)
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
      console.log('Current status response:', response.data)
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

  const handleAppointmentStatusUpdate = (data) => {
    console.log('Received appointment status update:', data)
    
    // Update appointments list in real-time
    setAppointments(prev => prev.map(appointment => 
      appointment._id === data.appointmentId 
        ? { ...appointment, status: data.status }
        : appointment
    ))
    
    // Update current appointment if it matches
    if (currentAppointment && currentAppointment._id === data.appointmentId) {
      setCurrentAppointment(prev => ({ ...prev, status: data.status }))
    }
    
    // Set updated appointment ID for visual feedback
    setUpdatedAppointmentId(data.appointmentId)
    setTimeout(() => setUpdatedAppointmentId(null), 3000) // Clear after 3 seconds
    
    // Show toast notification
    const statusText = data.status === 'waiting' ? 'Waiting' :
                      data.status === 'in-progress' ? 'In Consultation' :
                      data.status === 'completed' ? 'Completed' : data.status
    
    toast.success(`Your appointment status updated to: ${statusText}`, {
      duration: 4000,
      icon: '🏥',
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #10b981'
      }
    })
  }

  const handleBookingSuccess = (appointment) => {
    setShowBookingForm(false)
    // Add a small delay to ensure backend has processed the booking
    setTimeout(() => {
      fetchAppointments()
      fetchCurrentStatus()
    }, 1000)
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
    <div className="min-h-screen w-full relative">
      {/* Emerald Void */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)",
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-0 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full mb-12 shadow-2xl border border-white/20">
            <div className={`w-3 h-3 rounded-full shadow-lg ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium tracking-wider uppercase" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {isConnected ? 'Live Queue Tracking' : 'Offline Mode'}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4 leading-tight max-w-5xl mx-auto tracking-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          Say Goodbye to Long Waits Experience Seamless, Real-Time Appointment Management at <span className="italic text-orange-500">(Ashok Hospital)</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Book, track, and get notified — all from your phone.         </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-8 mb-16 justify-center">
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-white text-black hover:bg-gray-50 px-12 py-6 text-xl font-medium rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:bg-white/80 border border-gray-200"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
          >
            <BookOpen className="mr-0 w-7 h-7" />
            Book Appointment
          </Button>
          <Button
            onClick={() => {/* Contact us action */}}
            className="bg-white text-black hover:bg-gray-50 px-12 py-6 text-xl font-medium rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:bg-white/80 border border-gray-200"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
          >
            <User className="mr-0 w-7 h-7" />
            Contact Us
          </Button>
        </div>



        {/* Current Appointment Section */}
        {currentAppointment && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-8 shadow-2xl border border-gray-800">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Stethoscope className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">
                      Dr. {currentAppointment.doctor.name}
                    </h3>
                    <p className="text-gray-300 text-lg">{currentAppointment.doctor.specialization}</p>
                  </div>
                </div>
                <div className="bg-white text-black px-6 py-3 rounded-full text-sm font-black shadow-lg">
                  {currentAppointment.status.replace('-', ' ').toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium">Appointment Date</p>
                    <span className="text-xl font-black text-white">
                      {format(new Date(currentAppointment.appointmentDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium">Time Slot</p>
                    <span className="text-xl font-black text-white">{currentAppointment.timeSlot}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white text-black rounded-2xl p-8 text-center shadow-xl">
                <div className="text-6xl font-black mb-4">
                  A{currentAppointment.queueNumber?.toString().padStart(2, '0') || '01'}
                </div>
                <p className="text-2xl font-black text-gray-800">
                  Estimated wait time: {currentAppointment.estimatedWaitTime} minutes
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Live Appointment Tracker */}
        

        {/* Live Queue Status */}
        <div className="mb-12">
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-black text-white p-8 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Live Queue Status</h3>
                    <p className="text-gray-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Real-time appointment tracking</p>
                  </div>
                </div>
                <div className="bg-black text-white px-4 py-2 rounded-lg shadow-xl text-center border border-emerald-500/30" style={{
                  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #001a00 100%)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="text-xs font-medium text-emerald-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                    {format(currentTime, 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                    {format(currentTime, 'hh:mm:ss a')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8">
                          {/* Live Tracking Status */}
            <div className="space-y-8">
              {isConnected && (
                <div className="flex items-center justify-center mb-4">
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-full border border-emerald-500/30">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                      Real-time updates active
                    </span>
                  </div>
                </div>
              )}
                {appointments.length > 0 ? (
                  appointments.map((appointment, index) => (
                    <div key={appointment._id} className="mb-8">
                      <div className="flex items-center space-x-4 mb-6 p-4 rounded-xl border border-emerald-500/30" style={{
                        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #001a00 100%)'
                      }}>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                            {appointment.doctor?.name || 'Doctor'}
                          </h4>
                          <p className="text-xs text-emerald-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                            {appointment.doctor?.specialization || 'Specialist'} • Room {appointment.doctor?.room || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-black text-white border-b border-gray-700">
                              <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Queue No.</th>
                              <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Patient Name</th>
                              <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Patient Status</th>
                              <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Est. Wait</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className={`border-b border-gray-700 transition-all duration-300 hover:bg-gray-900 ${
                              updatedAppointmentId === appointment._id 
                                ? 'bg-emerald-900/50 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                                : 'bg-black'
                            }`}>
                              <td className="py-4 px-6">
                                <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
                                  {appointment.queueNumber?.toString().padStart(2, '0') || '01'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-medium">
                                      {(appointment.patientName || appointment.patient?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-white font-medium">
                                    {appointment.patientName || appointment.patient?.name || 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full shadow-lg ${
                                    appointment.status === 'waiting' ? 'bg-yellow-400 animate-pulse' :
                                    appointment.status === 'in-progress' ? 'bg-green-400 animate-pulse' :
                                    appointment.status === 'completed' ? 'bg-red-400' :
                                    'bg-blue-400 animate-pulse'
                                  }`}></div>
                                  <span className={`font-medium ${
                                    appointment.status === 'waiting' ? 'text-yellow-400' :
                                    appointment.status === 'in-progress' ? 'text-green-400' :
                                    appointment.status === 'completed' ? 'text-red-400' :
                                    'text-blue-400'
                                  }`}>
                                    {appointment.status === 'waiting' ? 'Waiting' :
                                     appointment.status === 'in-progress' ? 'In Consultation' :
                                     appointment.status === 'completed' ? 'Completed' :
                                     'Up Next'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-white font-medium">
                                {appointment.status === 'in-progress' || appointment.status === 'completed' ? '-' : '5-8 min'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-300 font-black text-lg mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                      No appointments found
                    </p>
                    <p className="text-gray-500">Book an appointment to see it here</p>
                  </div>
                )}
              </div>
                
          </div>
        </div>

        

      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm onBookingSuccess={handleBookingSuccess} />
      )}
    </div>
    </div>
  )
}

export default UserDashboard

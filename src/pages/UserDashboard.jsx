import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Phone, Calendar, Clock, User, Stethoscope, CheckCircle, AlertCircle, XCircle, ChevronDown, ArrowRight, Star, Zap, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from '../context/AuthContext'
import { appointmentsAPI, doctorsAPI } from '../services/supabaseApi'
import toast from 'react-hot-toast'
import BookingForm from './BookingForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

const UserDashboard = () => {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [allAppointments, setAllAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll()
      if (response && response.data && response.data.success) {
        setDoctors(response.data.doctors || [])
        console.log('Doctors loaded:', response.data.doctors)
      } else {
        console.error('Failed to load doctors:', response)
        setDoctors([])
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
    }
  }

  // Fetch user's appointments
  const fetchAppointments = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await appointmentsAPI.getMyAppointments(user._id || user.id)
      
      if (response && response.data && response.data.success) {
        const allAppts = response.data.appointments || []
        setAllAppointments(allAppts)
        
        // Filter by selected doctor if any
        if (selectedDoctor) {
          const filteredAppts = allAppts.filter(apt => 
            apt.doctor && apt.doctor.id === selectedDoctor.id
          )
          setAppointments(filteredAppts)
        } else {
          setAppointments(allAppts)
        }
        
        console.log('Appointments fetched:', allAppts)
      } else {
        console.log('No appointments found or API error')
        setAllAppointments([])
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAllAppointments([])
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Handle doctor selection
  const handleDoctorSelect = (doctor) => {
    console.log('👨‍⚕️ Doctor selected:', doctor)
    setSelectedDoctor(doctor)
    
    if (doctor) {
      // Filter appointments for selected doctor
      const filteredAppts = allAppointments.filter(apt => 
        apt.doctor && apt.doctor.id === doctor.id
      )
      setAppointments(filteredAppts)
      toast.success(`Showing appointments for ${doctor.name}`, {
        style: {
          background: '#000000',
          color: '#ffffff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
    } else {
      // Show all appointments
      setAppointments(allAppointments)
      toast.success('Showing all appointments', {
        style: {
          background: '#000000',
          color: '#ffffff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
    }
  }

  // Refresh appointments
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAppointments()
    setRefreshing(false)
    toast.success('Appointments refreshed!')
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user) {
      fetchDoctors()
      fetchAppointments()
      
      const interval = setInterval(() => {
        fetchAppointments()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  // Update appointments when allAppointments or selectedDoctor changes
  useEffect(() => {
    if (selectedDoctor) {
      const filteredAppts = allAppointments.filter(apt => 
        apt.doctor && apt.doctor.id === selectedDoctor.id
      )
      setAppointments(filteredAppts)
    } else {
      setAppointments(allAppointments)
    }
  }, [allAppointments, selectedDoctor])

  const handleBookingSuccess = (appointment) => {
    setShowBookingForm(false)
    if (appointment) {
      toast.success('Appointment booked successfully!')
      // Refresh appointments to show the new one
      fetchAppointments()
    }
  }

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'waiting':
        return { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: 'Waiting' }
      case 'in-progress':
        return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', text: 'In Consultation' }
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', text: 'Completed' }
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', text: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', text: 'Unknown' }
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Show landing experience when no user
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full text-sm font-medium shadow-lg mb-8">
              <Star className="w-4 h-4 mr-2" />
              Welcome to QueueSmart
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
              Experience Seamless
              <span className="block bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                Healthcare
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who trust QueueSmart for their healthcare needs. 
              Book appointments instantly and skip the wait.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              onClick={() => navigate('/booking')}
              className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-black/25 transition-all duration-300 transform hover:scale-105"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
            <Button
              onClick={() => navigate('/verify-otp')}
              className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-2" />
              Login with OTP
            </Button>
            <Button
              onClick={() => navigate('/doctor')}
              className="bg-gray-800 hover:bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              👨‍⚕️ Doctor Dashboard
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Real-Time Tracking</h3>
              <p className="text-gray-600">Monitor your appointment status live with instant updates</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Expert Doctors</h3>
              <p className="text-gray-600">Choose from our team of experienced healthcare professionals</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Secure & Private</h3>
              <p className="text-gray-600">Your health information is protected with bank-level security</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show dashboard when user exists
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-0 right-0">
            <Button
              onClick={logout}
              variant="outline"
              className="border-2 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full text-sm font-medium shadow-lg mb-6">
            <Star className="w-4 h-4 mr-2" />
            Welcome Back
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-black mb-4">
            Welcome, {user.name}!
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Skip the wait, join the queue, and see your doctor faster!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-black/25 transition-all duration-300 transform hover:scale-105"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Doctor Selection Section */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-2xl font-bold text-black">
              Filter by Doctor
            </h4>
            <span className="text-gray-600 font-medium">
              {selectedDoctor ? `Showing: ${selectedDoctor.name}` : 'Showing: All Doctors'}
            </span>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                >
                  {selectedDoctor ? selectedDoctor.name : 'Select Doctor'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 min-w-[280px]"
              >
                <div className="p-3 border-b-2 border-gray-200 mb-2">
                  <span className="text-sm font-bold text-black">
                    Available Doctors
                  </span>
                </div>
                
                {/* Show All Option */}
                <DropdownMenuItem
                  onClick={() => handleDoctorSelect(null)}
                  className="p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-black">Show All Doctors</div>
                    <div className="text-sm text-gray-600">
                      View appointments from all doctors
                    </div>
                  </div>
                </DropdownMenuItem>
                
                {/* Individual Doctors */}
                {doctors.map((doctor) => (
                  <DropdownMenuItem
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-black">{doctor.name}</div>
                      <div className="text-sm text-gray-600">
                        {doctor.specialization} • Room {doctor.room}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Clear Selection Button */}
            {selectedDoctor && (
              <Button
                onClick={() => handleDoctorSelect(null)}
                className="border-2 border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold text-black">
              Your Appointments
              {selectedDoctor && (
                <span className="text-xl text-gray-600 ml-3">
                  • {selectedDoctor.name}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 font-medium">Live Updates Active</span>
            </div>
          </div>

          {/* Current Appointment Status */}
          {appointments.length > 0 && appointments.some(apt => apt.status === 'waiting' || apt.status === 'in-progress') && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
              <h4 className="text-xl font-bold text-green-800 mb-4 text-center">
                🚀 Current Appointment Status
              </h4>
              {appointments
                .filter(apt => apt.status === 'waiting' || apt.status === 'in-progress')
                .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                .map((appointment, index) => {
                  const statusInfo = getStatusInfo(appointment.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={appointment.id} className="bg-white border-2 border-green-200 rounded-xl p-6 mb-4 last:mb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="bg-green-600 text-white px-6 py-3 rounded-full text-xl font-bold">
                            #{appointment.queue_number || 'N/A'}
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-800 mb-1">
                              {appointment.doctor?.name || 'Unknown Doctor'}
                            </div>
                            <div className="text-green-600">
                              {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'N/A'} at {appointment.time_slot || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <span className={`${statusInfo.bgColor} ${statusInfo.color} px-4 py-2 rounded-full font-semibold flex items-center gap-2`}>
                            <StatusIcon className="w-5 h-5" />
                            {statusInfo.text}
                          </span>
                          
                          {appointment.estimated_wait_time && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {appointment.estimated_wait_time} min
                              </div>
                              <div className="text-sm text-green-600">Est. Wait</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Appointment Statistics */}
          {appointments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-800 mb-2">
                  {appointments.length}
                </div>
                <div className="text-blue-600 font-semibold">
                  {selectedDoctor ? 'Appointments' : 'Total Appointments'}
                </div>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-800 mb-2">
                  {appointments.filter(apt => apt.status === 'waiting').length}
                </div>
                <div className="text-yellow-600 font-semibold">Waiting</div>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-800 mb-2">
                  {appointments.filter(apt => apt.status === 'in-progress').length}
                </div>
                <div className="text-blue-600 font-semibold">In Consultation</div>
              </div>
              
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-800 mb-2">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </div>
                <div className="text-green-600 font-semibold">Completed</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-bold text-black">Token No.</th>
                    <th className="text-left py-4 px-6 font-bold text-black">Date</th>
                    <th className="text-left py-4 px-6 font-bold text-black">Time</th>
                    <th className="text-left py-4 px-6 font-bold text-black">Consultant</th>
                    <th className="text-left py-4 px-6 font-bold text-black">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-black">Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => {
                    const statusInfo = getStatusInfo(appointment.status)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <tr key={appointment.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <span className="bg-black text-white px-4 py-2 rounded-full font-bold">
                            #{appointment.queue_number || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {appointment.time_slot || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {appointment.doctor ? (
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="font-semibold">{appointment.doctor.name}</div>
                                <div className="text-sm text-gray-500">
                                  {appointment.doctor.specialization} • Room {appointment.doctor.room}
                                </div>
                              </div>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`${statusInfo.bgColor} ${statusInfo.color} px-3 py-1 rounded-full font-semibold flex items-center gap-1 w-fit`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {appointment.estimated_wait_time ? (
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                {appointment.estimated_wait_time} min
                              </div>
                              <div className="text-sm text-gray-500">Est. Wait</div>
                            </div>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-2xl font-bold text-black mb-4">
                {selectedDoctor ? `No Appointments with ${selectedDoctor.name}` : 'No Appointments Yet'}
              </h4>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {selectedDoctor 
                  ? `You haven't booked any appointments with ${selectedDoctor.name} yet.`
                  : "You haven't booked any appointments yet. Click 'Book Appointment' to schedule your first visit."
                }
              </p>
              {!selectedDoctor && (
                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Book Your First Appointment
                </Button>
              )}
              {selectedDoctor && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setShowBookingForm(true)}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Book with {selectedDoctor.name}
                  </Button>
                  <Button
                    onClick={() => handleDoctorSelect(null)}
                    className="border-2 border-gray-300 text-gray-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    Show All Doctors
                  </Button>
                </div>
              )}
            </div>
          )}
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

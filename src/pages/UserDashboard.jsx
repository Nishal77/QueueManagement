import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Phone, Calendar, Clock, User, Stethoscope, CheckCircle, AlertCircle, XCircle, ChevronDown } from 'lucide-react'
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
  const { user } = useAuth()

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
          background: '#10b981',
          color: '#fff',
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
          background: '#10b981',
          color: '#fff',
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
      <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Hero Section */}
          <div style={{ marginBottom: '40px', padding: '40px 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
              Welcome to QueueManagement
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
              Experience Seamless, Real-Time Appointment Management at Ashok Hospital
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
            <Button
              onClick={() => navigate('/booking')}
              style={{ padding: '15px 30px', fontSize: '1.1rem' }}
            >
              <BookOpen style={{ marginRight: '8px' }} />
              Book Appointment
            </Button>
            <Button
              onClick={() => navigate('/verify-otp')}
              style={{ padding: '15px 30px', fontSize: '1.1rem' }}
            >
              <Phone style={{ marginRight: '8px' }} />
              Login with OTP
            </Button>
            <Button
              onClick={() => navigate('/doctor')}
              style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#10b981' }}
            >
              👨‍⚕️ Doctor Dashboard
            </Button>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#333' }}>Real-Time Tracking</h3>
              <p style={{ color: '#666' }}>Monitor your appointment status live with instant updates</p>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#333' }}>Expert Doctors</h3>
              <p style={{ color: '#666' }}>Choose from our team of experienced healthcare professionals</p>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#333' }}>Secure & Private</h3>
              <p style={{ color: '#666' }}>Your health information is protected with bank-level security</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show dashboard when user exists
  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className='font-bold item-center' style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
            Welcome, {user.name}!
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '20px', fontWeight: 600 }}>
            Skip the wait, join the queue, and see your doctor faster!
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
          <Button
            onClick={() => setShowBookingForm(true)}
            style={{ padding: '15px 30px', fontSize: '1.1rem' }}
          >
            Book Appointment
          </Button>
        </div>

        {/* User Info Card
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            display: 'inline-block'
          }}>
            <p style={{ margin: '0', color: '#495057' }}>
              <strong>Phone:</strong> {user.phoneNumber} | <strong>Age:</strong> {user.age} | <strong>Gender:</strong> {user.gender}
            </p>
          </div>
        </div> */}

        {/* Doctor Selection Section */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '1.2rem', color: '#333', margin: 0 , fontWeight: 600 }}>
              Filter by Doctor
            </h4>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {selectedDoctor ? `Showing: ${selectedDoctor.name}` : 'Showing: All Doctors'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg text-white font-semibold transition-all duration-200 shadow-md
                    ${selectedDoctor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-black hover:bg-gray-900'}
                    focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                >
                  {selectedDoctor ? selectedDoctor.name : 'Select Doctor'}
                  <ChevronDown style={{ width: '16px', height: '16px' }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '8px',
                  minWidth: '250px'
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                    Available Doctors
                  </span>
                </div>
                
                {/* Show All Option */}
                <DropdownMenuItem
                  onClick={() => handleDoctorSelect(null)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6'
                    e.target.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User style={{ width: '16px', height: '16px', color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#111827' }}>Show All Doctors</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      View appointments from all doctors
                    </div>
                  </div>
                </DropdownMenuItem>
                
                {/* Individual Doctors */}
                {doctors.map((doctor) => (
                  <DropdownMenuItem
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: '1px solid transparent',
                      transition: 'all 0.2s',
                      backgroundColor: selectedDoctor?.id === doctor.id ? '#f0fdf4' : 'transparent',
                      borderColor: selectedDoctor?.id === doctor.id ? '#10b981' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDoctor?.id !== doctor.id) {
                        e.target.style.backgroundColor = '#f3f4f6'
                        e.target.style.borderColor = '#10b981'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDoctor?.id !== doctor.id) {
                        e.target.style.backgroundColor = selectedDoctor?.id === doctor.id ? '#f0fdf4' : 'transparent'
                        e.target.style.borderColor = selectedDoctor?.id === doctor.id ? '#10b981' : 'transparent'
                      }
                    }}
                  >
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: '#10b981', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Stethoscope style={{ width: '16px', height: '16px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{doctor.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {doctor.specialization} • Room {doctor.room}
                      </div>
                    </div>
                    {selectedDoctor?.id === doctor.id && (
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#10b981', 
                        borderRadius: '50%',
                        marginLeft: 'auto'
                      }}></div>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Clear Selection Button */}
            {selectedDoctor && (
              <Button
                onClick={() => handleDoctorSelect(null)}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.9rem',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Appointments Section */}
        <div style={{ 
          padding: '30px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.5rem', color: '#333', margin: 0 }}>
              Your Appointments
              {selectedDoctor && (
                <span style={{ fontSize: '1rem', color: '#10b981', marginLeft: '10px' }}>
                  • {selectedDoctor.name}
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#10b981', 
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Live Updates Active</span>
            </div>
          </div>

          {/* Current Appointment Status */}
          {appointments.length > 0 && appointments.some(apt => apt.status === 'waiting' || apt.status === 'in-progress') && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px', 
              border: '2px solid #10b981',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '1.1rem', color: '#065f46', marginBottom: '15px', textAlign: 'center' }}>
                🚀 Current Appointment Status
              </h4>
              {appointments
                .filter(apt => apt.status === 'waiting' || apt.status === 'in-progress')
                .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                .map((appointment, index) => {
                  const statusInfo = getStatusInfo(appointment.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={appointment.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5',
                      marginBottom: index < appointments.filter(apt => apt.status === 'waiting' || apt.status === 'in-progress').length - 1 ? '10px' : '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '25px',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          minWidth: '60px',
                          textAlign: 'center'
                        }}>
                          #{appointment.queue_number || 'N/A'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '5px' }}>
                            {appointment.doctor?.name || 'Unknown Doctor'}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                            {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'N/A'} at {appointment.time_slot || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <StatusIcon style={{ width: '16px', height: '16px' }} />
                          {statusInfo.text}
                        </span>
                        
                        {appointment.estimated_wait_time && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                              {appointment.estimated_wait_time} min
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#047857' }}>Est. Wait</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Appointment Statistics */}
          {appointments.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '15px', 
              marginBottom: '20px' 
            }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px', 
                border: '1px solid #0ea5e9',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '5px' }}>
                  {appointments.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0c4a6e' }}>
                  {selectedDoctor ? 'Appointments' : 'Total Appointments'}
                </div>
                {selectedDoctor && (
                  <div style={{ fontSize: '0.7rem', color: '#0ea5e9', marginTop: '2px' }}>
                    for {selectedDoctor.name}
                  </div>
                )}
              </div>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px', 
                border: '1px solid #f59e0b',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e', marginBottom: '5px' }}>
                  {appointments.filter(apt => apt.status === 'waiting').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Waiting</div>
              </div>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#dbeafe', 
                borderRadius: '8px', 
                border: '1px solid #3b82f6',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
                  {appointments.filter(apt => apt.status === 'in-progress').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>In Consultation</div>
              </div>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#dcfce7', 
                borderRadius: '8px', 
                border: '1px solid #10b981',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46', marginBottom: '5px' }}>
                  {appointments.filter(apt => apt.status === 'completed').length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Completed</div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#666' }}>Loading your appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Token No.</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Consultant</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#495057', fontWeight: '600' }}>Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => {
                    const statusInfo = getStatusInfo(appointment.status)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <tr key={appointment.id || index} style={{ 
                        borderBottom: '1px solid #e9ecef',
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                      }}>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            display: 'inline-block'
                          }}>
                            #{appointment.queue_number || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', color: '#495057' }}>
                          {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'N/A'}
                        </td>
                        <td style={{ padding: '15px', color: '#495057' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock style={{ width: '16px', height: '16px', color: '#666' }} />
                            {appointment.time_slot || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '15px', color: '#495057' }}>
                          {appointment.doctor ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Stethoscope style={{ width: '16px', height: '16px', color: '#666' }} />
                              <div>
                                <div style={{ fontWeight: '500' }}>{appointment.doctor.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                  {appointment.doctor.specialization} • Room {appointment.doctor.room}
                                </div>
                              </div>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'fit-content'
                          }}>
                            <StatusIcon style={{ width: '14px', height: '14px' }} />
                            {statusInfo.text}
                          </span>
                        </td>
                        <td style={{ padding: '15px', color: '#495057' }}>
                          {appointment.estimated_wait_time ? (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>
                                {appointment.estimated_wait_time} min
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>Est. Wait</div>
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
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#f8f9fa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Calendar style={{ width: '40px', height: '40px', color: '#666' }} />
              </div>
              <h4 style={{ fontSize: '1.2rem', color: '#333', marginBottom: '10px' }}>
                {selectedDoctor ? `No Appointments with ${selectedDoctor.name}` : 'No Appointments Yet'}
              </h4>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {selectedDoctor 
                  ? `You haven't booked any appointments with ${selectedDoctor.name} yet.`
                  : "You haven't booked any appointments yet. Click 'Book Appointment' to schedule your first visit."
                }
              </p>
              {!selectedDoctor && (
                <Button
                  onClick={() => setShowBookingForm(true)}
                  style={{ padding: '12px 24px', fontSize: '1rem' }}
                >
                  <BookOpen style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                  Book Your First Appointment
                </Button>
              )}
              {selectedDoctor && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Button
                    onClick={() => setShowBookingForm(true)}
                    style={{ padding: '12px 24px', fontSize: '1rem' }}
                  >
                    <BookOpen style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                    Book with {selectedDoctor.name}
                  </Button>
                  <Button
                    onClick={() => handleDoctorSelect(null)}
                    style={{ 
                      padding: '12px 24px', 
                      fontSize: '1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      border: '1px solid #d1d5db'
                    }}
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

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default UserDashboard

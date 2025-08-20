import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Heart,
  Users,
  Activity,
  TrendingUp,
  ChevronDown
} from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { appointmentsAPI, doctorsAPI } from '../services/supabaseApi'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import '../assets/fonts/BricolageGrotesque-Medium.ttf'
import DataDebugger from '../components/DataDebugger'

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedToday: 0,
    waitingPatients: 0
  })
  const [lastUpdateTime, setLastUpdateTime] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDoctors()
    // Reset selected doctor when component mounts
    setSelectedDoctor(null)
  }, [])

  useEffect(() => {
    if (selectedDoctor) {
      fetchAppointments()
      
      // Set up real-time subscription for live updates
      const subscription = supabase
        .channel('appointments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${selectedDoctor.id}`
          },
          (payload) => {
            console.log('Real-time update received:', payload)
            // Refresh appointments when there are changes
            fetchAppointments()
          }
        )
        .subscribe()
      
      // Cleanup subscription on unmount or doctor change
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [selectedDoctor])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  // Auto-refresh appointments every 30 seconds for live updates
  useEffect(() => {
    if (selectedDoctor) {
      const autoRefreshTimer = setInterval(() => {
        console.log('🔄 Auto-refreshing appointments...')
        fetchAppointments()
      }, 30000) // 30 seconds
      
      return () => clearInterval(autoRefreshTimer)
    }
  }, [selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll()
      console.log('Doctors response:', response)
      
      if (response && response.data && response.data.success) {
        setDoctors(response.data.doctors || [])
      } else {
        console.error('Doctors API returned error:', response)
        // Set mock doctors if API fails
        const mockDoctors = [
          { id: '1', name: 'Dr. Sarah Johnson', specialization: 'Cardiologist', room: '101' },
          { id: '2', name: 'Dr. Robert Williams', specialization: 'Neurologist', room: '205' },
          { id: '3', name: 'Dr. Emily Davis', specialization: 'Pediatrician', room: '103' }
        ]
        setDoctors(mockDoctors)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      // Set mock doctors for demonstration
      const mockDoctors = [
        { id: '1', name: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', room: '101' },
        { id: '2', name: 'Dr. Priya Sharma', specialization: 'Neurologist', room: '205' },
        { id: '3', name: 'Dr. Amit Patel', specialization: 'Pediatrician', room: '103' }
      ]
      setDoctors(mockDoctors)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    if (!selectedDoctor) return
    
    try {
      console.log('Fetching appointments for doctor:', selectedDoctor.name)
      console.log('Doctor ID:', selectedDoctor.id)
      
      // Fetch appointments with proper joins - try multiple query approaches
      let allAppointments = null
      let error = null
      
      // First try: Simple join query
      const { data: simpleQuery, error: simpleError } = await supabase
        .from('appointments')
        .select(`
          id,
          queue_number,
          time_slot,
          status,
          appointment_date,
          estimated_wait_time,
          patients(
            name,
            gender,
            phone_number
          ),
          doctors(
            name,
            specialization,
            room
          )
        `)
        .eq('doctor_id', selectedDoctor.id)
        .order('queue_number', { ascending: true })
      
      if (simpleError) {
        console.log('⚠️ Simple query failed, trying alternative...')
        
        // Second try: Alternative query structure
        const { data: altQuery, error: altError } = await supabase
          .from('appointments')
          .select(`
            id,
            queue_number,
            time_slot,
            status,
            appointment_date,
            estimated_wait_time,
            patients:patients(name, gender, phone_number),
            doctors:doctors(name, specialization, room)
          `)
          .eq('doctor_id', selectedDoctor.id)
          .order('queue_number', { ascending: true })
        
        if (altError) {
          console.log('Alternative query also failed, trying basic query...')
          
          // Third try: Basic query without joins
          const { data: basicQuery, error: basicError } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', selectedDoctor.id)
            .order('queue_number', { ascending: true })
          
          if (basicError) {
            error = basicError
          } else {
            allAppointments = basicQuery
            console.log('Basic query successful, will fetch related data separately')
          }
        } else {
          allAppointments = altQuery
          console.log('Alternative query successful')
        }
      } else {
        allAppointments = simpleQuery
        console.log('Simple query successful')
      }
      
      if (error) {
        console.error('Error with inner join query, trying fallback:', error)
        
        // Fallback: Try with regular joins
        const { data: fallbackAppointments, error: fallbackError } = await supabase
          .from('appointments')
          .select(`
            id,
            queue_number,
            time_slot,
            status,
            appointment_date,
            estimated_wait_time,
            patients(
              name,
              gender,
              phone_number
            ),
            doctors(
              name,
              specialization,
              room
            )
          `)
          .eq('doctor_id', selectedDoctor.id)
          .order('queue_number', { ascending: true })
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          setAppointments([])
          return
        }
        
        allAppointments = fallbackAppointments
        console.log('✅ Using fallback query data:', allAppointments)
      }
      
      console.log('Appointments fetched:', allAppointments)
      console.log('Raw appointment data sample:', allAppointments[0])
      console.log('Patient data sample:', allAppointments[0]?.patients)
      console.log('Doctor data sample:', allAppointments[0]?.doctors)
      
      // Ensure we have appointments data
      if (!allAppointments || allAppointments.length === 0) {
        console.log('⚠️ No appointments found for this doctor')
        setAppointments([])
        setStats({
          totalPatients: 0,
          todayAppointments: 0,
          completedToday: 0,
          waitingPatients: 0
        })
        return
      }
      
      // Format appointments with data validation
      let formattedAppointments = []
      
      if (allAppointments && allAppointments.length > 0) {
        // Check if we have joined data or need to fetch separately
        const hasJoinedData = allAppointments[0].patients || allAppointments[0].doctors
        
        if (hasJoinedData) {
          // Use joined data
          formattedAppointments = allAppointments
            .filter(apt => apt && apt.id)
            .map(apt => {
              const patientData = apt.patients || {}
              const doctorData = apt.doctors || {}
              
              const appointment = {
                id: apt.id,
                tokenNumber: apt.queue_number || 'N/A',
                patientName: patientData.name || 'Unknown',
                phoneNumber: patientData.phone_number || 'N/A',
                appointmentTime: apt.time_slot || 'N/A',
                gender: patientData.gender || 'Unknown',
                status: apt.status || 'waiting',
                appointmentDate: apt.appointment_date || 'N/A',
                estimatedWaitTime: apt.estimated_wait_time || 0
              }
              
              console.log('🔍 Formatted appointment (joined):', appointment)
              return appointment
            })
        } else {
          // Fetch patient and doctor data separately
          console.log('Fetching patient and doctor data separately...')
          
          formattedAppointments = await Promise.all(
            allAppointments
              .filter(apt => apt && apt.id)
              .map(async (apt) => {
                // Fetch patient data
                const { data: patientData } = await supabase
                  .from('patients')
                  .select('name, gender, phone_number')
                  .eq('id', apt.patient_id)
                  .single()
                
                // Fetch doctor data
                const { data: doctorData } = await supabase
                  .from('doctors')
                  .select('name, specialization, room')
                  .eq('id', apt.doctor_id)
                  .single()
                
                const appointment = {
                  id: apt.id,
                  tokenNumber: apt.queue_number || 'N/A',
                  patientName: patientData?.name || 'Unknown',
                  phoneNumber: patientData?.phone_number || 'N/A',
                  appointmentTime: apt.time_slot || 'N/A',
                  gender: patientData?.gender || 'Unknown',
                  status: apt.status || 'waiting',
                  appointmentDate: apt.appointment_date || 'N/A',
                  estimatedWaitTime: apt.estimated_wait_time || 0
                }
                
                console.log('Formatted appointment (separate):', appointment)
                return appointment
              })
          )
        }
      }
      
      setAppointments(formattedAppointments)
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayAppointments = formattedAppointments.filter(apt => 
        apt.appointmentDate === today
      )
      
      setStats({
        totalPatients: formattedAppointments.length,
        todayAppointments: todayAppointments.length,
        completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
        waitingPatients: formattedAppointments.filter(apt => apt.status === 'waiting').length
      })
      
      console.log('Stats updated:', {
        totalPatients: formattedAppointments.length,
        todayAppointments: todayAppointments.length,
        completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
        waitingPatients: formattedAppointments.filter(apt => apt.status === 'waiting').length
      })
      
    } catch (error) {
      console.error('Error in fetchAppointments:', error)
      setAppointments([])
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        completedToday: 0,
        waitingPatients: 0
      })
    }
  }

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      console.log('Updating appointment status:', { appointmentId, newStatus });
      
      // Update appointment status in backend
      const response = await appointmentsAPI.updateAppointmentStatus(appointmentId, newStatus)
      
      if (response && response.data && response.data.success) {
        setLastUpdateTime(new Date())
        
        // Update local state immediately
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ))
        
        // Update stats
        const updatedAppointment = appointments.find(apt => apt.id === appointmentId)
        if (updatedAppointment) {
          const today = new Date().toDateString()
          const todayAppointments = appointments.filter(apt => 
            new Date(apt.appointment_date).toDateString() === today
          )
          
          setStats(prev => ({
            ...prev,
            completedToday: newStatus === 'completed' ? prev.completedToday + 1 : prev.completedToday,
            waitingPatients: newStatus === 'waiting' ? prev.waitingPatients + 1 : 
                            newStatus === 'in-progress' ? prev.waitingPatients - 1 : prev.waitingPatients
          }))
        }
        
        toast.success(`Appointment ${newStatus}`)
      } else {
        toast.error('Failed to update appointment status')
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Failed to update appointment status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full relative">
        <div className="absolute inset-0 z-0" style={{
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)",
        }} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-8"></div>
            <p className="text-white text-xl">Loading Doctor Dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Emerald Void Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)",
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full mb-12 shadow-2xl border border-white/20">
            <div className="w-3 h-3 rounded-full shadow-lg bg-emerald-400 animate-pulse"></div>
            <span className="text-sm font-medium tracking-wider uppercase" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Live Doctor Dashboard
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white mb-8 leading-tight max-w-5xl mx-auto tracking-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Healthcare Management System
          </h2>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-light" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Manage appointments, track patient progress, and provide exceptional care
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-black backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Total Patients</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{stats.totalPatients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-black backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Today's Appointments</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{stats.todayAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-black backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Completed Today</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-black backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Waiting Patients</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{stats.waitingPatients}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Selection Section */}
        <div className="mb-8">
          <div className="bg-black backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/40 shadow-2xl" style={{
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Select Doctor</h2>
              </div>
              <p className="text-emerald-200 text-base leading-relaxed" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                Choose a doctor to view their patient appointments and manage their queue
              </p>
            </div>

            {/* Doctor Selection Button with Shadcn Dropdown */}
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 px-10 py-5 rounded-3xl font-bold shadow-2xl transition-all duration-300 flex items-center space-x-5 border border-emerald-400/40 hover:border-emerald-300/60 text-xl"
                    style={{ 
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                      boxShadow: '0 20px 40px rgba(16, 185, 129, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <span className="font-semibold">Select Doctor</span>
                    <ChevronDown className="w-6 h-6 transition-all duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-96 bg-black border border-emerald-500/60 rounded-2xl shadow-2xl p-0" 
                  style={{
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-base font-semibold text-emerald-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                        Available Doctors
                      </div>
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                    </div>
                    <div className="space-y-2">
                      {doctors.map((doctor) => (
                        <DropdownMenuItem
                          key={doctor.id}
                          onClick={() => {
                            console.log('👨‍⚕️ Doctor selected:', doctor)
                            setSelectedDoctor(doctor)
                          }}
                          className="group flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:bg-gray-900 hover:border-emerald-500/30 focus:bg-gray-900 focus:border-emerald-500/30"
                        >
                          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-base" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                              {doctor.name}
                            </div>
                            <div className="text-xs text-gray-400" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                              {doctor.specialization} • Room {doctor.room}
                            </div>
                            <div className="text-xs text-emerald-400" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                              📞 {doctor.phone_number || 'N/A'}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Current Doctor Info */}
        {selectedDoctor && (
          <div className="mb-8">
            <div className="bg-black backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/40 shadow-2xl" style={{
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                        {selectedDoctor.name}
                      </h3>
                      <p className="text-emerald-300 text-base" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                        {selectedDoctor.specialization} • Room {selectedDoctor.room}
                      </p>
                      <p className="text-emerald-200 text-sm" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                        📞 {selectedDoctor.phone_number || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Live Updates Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Refresh Button */}
                  <Button
                    onClick={fetchAppointments}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                   
                    <span>Refresh</span>
                  </Button>
                  
                  {lastUpdateTime && (
                    <div className="flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 px-3 py-2 rounded-lg border border-emerald-500/30">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                        Update sent {format(lastUpdateTime, 'HH:mm:ss')}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => setSelectedDoctor(null)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 px-4 py-3 rounded-xl font-medium shadow-xl transition-all duration-300 flex items-center space-x-2 border border-gray-500/30 hover:border-gray-400/50"
                    style={{ 
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    
                    <span>Clear Selection</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        {selectedDoctor && (
          <div className="bg-black backdrop-blur-xl rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                    Patient Queue for {selectedDoctor.name}
                  </h3>
                  <p className="text-emerald-200">
                    Current Time: {currentTime.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total Patients</p>
                    <p className="text-2xl font-bold text-white">{appointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-emerald-500/30">
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Token No.</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Name</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Phone</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Time</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Gender</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 text-emerald-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b border-emerald-500/20 hover:bg-emerald-500/5 transition-colors">
                          <td className="py-4 px-6">
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              {appointment.tokenNumber}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {appointment.patientName || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {appointment.phoneNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {appointment.appointmentTime || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-medium">
                              {appointment.gender || 'Unknown'}
                            </span>
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
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              {appointment.status === 'waiting' && (
                                <Button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-lg transition-all duration-300"
                                >
                                  Start
                                </Button>
                              )}
                              {appointment.status === 'in-progress' && (
                                <Button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-xs rounded-lg transition-all duration-300"
                                >
                                  Complete
                                </Button>
                              )}
                              {appointment.status === 'completed' && (
                                <span className="text-emerald-400 text-xs font-medium">✓ Done</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-16 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-300 font-black text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                              No appointments found for {selectedDoctor?.name}
                            </p>
                            <p className="text-gray-500">This doctor has no scheduled appointments yet</p>
                            <div className="text-xs text-gray-600 bg-gray-800 px-3 py-2 rounded">
                              <p>Tip: Patients need to book appointments first</p>
                              <p>Go to `/booking` to create test appointments</p>
                              <p>Use the Data Debugger below to inspect database</p>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => window.open('/booking', '_blank')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                Go to Booking Form
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Data Debugger - Remove after fixing
      <DataDebugger /> */}
    </div>
  )
}

export default DoctorDashboard

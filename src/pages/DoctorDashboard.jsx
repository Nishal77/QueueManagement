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
import { appointmentsAPI, doctorsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import '../assets/fonts/BricolageGrotesque-Medium.ttf'

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
  const { user, logout } = useAuth()
  const { socket, isConnected, emitAppointmentUpdate } = useSocket()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchDoctors()
    // Reset selected doctor when component mounts
    setSelectedDoctor(null)
  }, [user, navigate])

  useEffect(() => {
    if (selectedDoctor) {
      fetchAppointments()
    }
  }, [selectedDoctor])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll()
      console.log('Doctors response:', response.data)
      setDoctors(response.data.doctors || response.data || [])
      
      // Don't auto-select any doctor - let user choose
      if (!response.data.doctors && !response.data) {
        // Set mock doctors if API fails
        const mockDoctors = [
          { _id: '1', name: 'Dr. Sarah Johnson', specialization: 'Cardiologist', room: '101' },
          { _id: '2', name: 'Dr. Robert Williams', specialization: 'Neurologist', room: '205' },
          { _id: '3', name: 'Dr. Emily Davis', specialization: 'Pediatrician', room: '103' }
        ]
        setDoctors(mockDoctors)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      // Set mock doctors for demonstration
      const mockDoctors = [
        { _id: '1', name: 'Dr. Sarah Johnson', specialization: 'Cardiologist', room: '101' },
        { _id: '2', name: 'Dr. Robert Williams', specialization: 'Neurologist', room: '205' },
        { _id: '3', name: 'Dr. Emily Davis', specialization: 'Pediatrician', room: '103' }
      ]
      setDoctors(mockDoctors)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    if (!selectedDoctor) return
    
    try {
      // Use the same API endpoint as UserDashboard to get consistent data
      const response = await appointmentsAPI.getMyAppointments()
      console.log('Appointments response:', response.data)
      
      // Ensure appointments have proper structure and filter for the selected doctor
      const allAppointments = (response.data.appointments || []).filter(appointment => 
        appointment && appointment._id && appointment.doctor
      )
      
      // Filter appointments for the selected doctor
      const validAppointments = allAppointments.filter(appointment => 
        appointment.doctor._id === selectedDoctor._id || 
        appointment.doctorId === selectedDoctor._id ||
        appointment.doctor.name === selectedDoctor.name
      )
      
      console.log('Filtered appointments for doctor:', validAppointments)
      setAppointments(validAppointments)
      
      // Calculate stats
      const today = new Date().toDateString()
      const todayAppointments = validAppointments.filter(apt => 
        new Date(apt.appointmentDate).toDateString() === today
      )
      
      setStats({
        totalPatients: validAppointments.length,
        todayAppointments: todayAppointments.length,
        completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
        waitingPatients: validAppointments.filter(apt => apt.status === 'waiting').length
      })
      
    } catch (error) {
      console.error('Error fetching appointments:', error)
      // No mock data - show empty state
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
      // Update appointment status in backend
      await appointmentsAPI.updateAppointmentStatus(appointmentId, newStatus)
      
      // Emit socket event for real-time updates
      const updateData = {
        appointmentId,
        status: newStatus,
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        timestamp: new Date().toISOString()
      }
      emitAppointmentUpdate(updateData)
      setLastUpdateTime(new Date())
      
      // Update local state immediately
      setAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ))
      
      // Update stats
      const updatedAppointment = appointments.find(apt => apt._id === appointmentId)
      if (updatedAppointment) {
        const today = new Date().toDateString()
        const todayAppointments = appointments.filter(apt => 
          new Date(apt.appointmentDate).toDateString() === today
        )
        
        setStats(prev => ({
          ...prev,
          completedToday: newStatus === 'completed' ? prev.completedToday + 1 : prev.completedToday,
          waitingPatients: newStatus === 'waiting' ? prev.waitingPatients + 1 : 
                          newStatus === 'in-progress' ? prev.waitingPatients - 1 : prev.waitingPatients
        }))
      }
      
      toast.success(`Appointment status updated to ${newStatus}`)
      
    } catch (error) {
      console.error('Error updating appointment status:', error)
      // For demo purposes, update the local state and emit socket event
      setAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ))
      
      // Emit socket event even in demo mode
      emitAppointmentUpdate({
        appointmentId,
        status: newStatus,
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        timestamp: new Date().toISOString()
      })
      
      toast.success(`Appointment status updated to ${newStatus} (demo mode)`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400'
      case 'in-progress': return 'text-green-400'
      case 'completed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusDot = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-400'
      case 'in-progress': return 'bg-green-400'
      case 'completed': return 'bg-red-400'
      default: return 'bg-gray-400'
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!selectedDoctor) {
    return (
      <div className="min-h-screen w-full relative">
        {/* Emerald Void */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)",
          }}
        />
        
        {/* Doctor Selection Screen */}
        <div className="relative z-10 min-h-screen p-8">
          {/* Header - Top Left */}
          <div className="mb-12">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  Doctor Dashboard
                </h1>
                <p className="text-sm text-emerald-200" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  Select a doctor to manage their patient appointments
                </p>
              </div>
            </div>
          </div>

                    {/* Centered Content */}
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            <div className="max-w-lg w-full">
              {/* Doctor Selection Card */}
              <div className="bg-black backdrop-blur-xl rounded-3xl p-10 border border-emerald-500/50 shadow-2xl" style={{
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg" style={{
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                    }}>
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
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
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
                            key={doctor._id}
                            onClick={() => setSelectedDoctor(doctor)}
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
            <div className={`w-3 h-3 rounded-full shadow-lg ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium tracking-wider uppercase" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {isConnected ? 'Live Doctor Dashboard' : 'Offline Mode'}
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

                {/* Current Doctor Info */}
        <div className="mb-8">
          <div className="bg-black backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/40 shadow-2xl" style={{
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                      {selectedDoctor.name}
                    </h3>
                    <p className="text-emerald-300 text-base" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                      {selectedDoctor.specialization} • Room {selectedDoctor.room}
                    </p>
                  </div>
                </div>
              </div>
                                <div className="flex items-center space-x-4">
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
                      <User className="w-4 h-4" />
                      <span>Back to Selection</span>
                    </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 px-6 py-3 rounded-xl font-medium shadow-xl transition-all duration-300 flex items-center space-x-3 border border-emerald-400/30 hover:border-emerald-300/50"
                      style={{ 
                        fontFamily: 'Bricolage Grotesque, sans-serif',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)'
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span>Change Doctor</span>
                      <ChevronDown className="w-4 h-4 transition-all duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-80 bg-black border border-emerald-500/50 rounded-2xl shadow-2xl p-0" 
                    style={{
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium text-emerald-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                          Available Doctors
                        </div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        {doctors.map((doctor) => (
                          <DropdownMenuItem
                            key={doctor._id}
                            onClick={() => setSelectedDoctor(doctor)}
                            className={`group flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                              selectedDoctor?._id === doctor._id 
                                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                                : 'border-transparent hover:bg-gray-900 hover:border-emerald-500/30'
                            } focus:bg-gray-900 focus:border-emerald-500/30`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              selectedDoctor?._id === doctor._id 
                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                                : 'bg-gray-700 group-hover:bg-emerald-500/20'
                            }`}>
                              <Stethoscope className={`w-6 h-6 transition-all duration-300 ${
                                selectedDoctor?._id === doctor._id 
                                  ? 'text-white' 
                                  : 'text-gray-400 group-hover:text-emerald-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium transition-all duration-300 ${
                                selectedDoctor?._id === doctor._id 
                                  ? 'text-white' 
                                  : 'text-gray-200 group-hover:text-white'
                              }`} style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                                {doctor.name}
                              </div>
                              <div className={`text-sm transition-all duration-300 ${
                                selectedDoctor?._id === doctor._id 
                                  ? 'text-emerald-300' 
                                  : 'text-gray-500 group-hover:text-gray-300'
                              }`} style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                                {doctor.specialization} • Room {doctor.room}
                              </div>
                            </div>
                            {selectedDoctor?._id === doctor._id && (
                              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-black backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden mt-8">
          <div className="bg-black text-white p-8 border-b border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                    {selectedDoctor ? `${selectedDoctor.name}'s Patients` : 'Patient Appointments'}
                  </h3>
                  <p className="text-gray-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                    {selectedDoctor ? `Manage ${selectedDoctor.specialization} appointments` : 'Manage and track all patient appointments'}
                  </p>
                </div>
              </div>
              <div className="bg-white text-black px-6 py-3 rounded-xl font-black shadow-lg text-center" style={{
                background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #001a00 100%)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                <div className="text-sm font-medium text-emerald-300" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  {format(currentTime, 'MMM dd, yyyy')}
                </div>
                <div className="text-base font-bold text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  {format(currentTime, 'hh:mm:ss a')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="overflow-hidden rounded-2xl border border-gray-700 bg-black">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white border-b border-gray-700">
                    <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Queue No.</th>
                    <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Patient Name</th>
                    <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Patient Status</th>
                    <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Est. Wait</th>
                    <th className="text-left py-4 px-6 font-medium text-sm uppercase tracking-wider" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment, index) => (
                      <tr 
                        key={appointment._id} 
                        className="border-b border-gray-700 bg-black transition-all duration-300 hover:bg-gray-900"
                      >
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
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            {appointment.status === 'waiting' && (
                              <Button
                                onClick={() => updateAppointmentStatus(appointment._id, 'in-progress')}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-lg transition-all duration-300"
                              >
                                Start
                              </Button>
                            )}
                            {appointment.status === 'in-progress' && (
                              <Button
                                onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
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
                      <td colSpan="5" className="py-16 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-300 font-black text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                            No appointments found
                          </p>
                          <p className="text-gray-500">Book an appointment to see it here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard

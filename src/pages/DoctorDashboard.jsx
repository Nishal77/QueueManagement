import { useState, useEffect } from 'react'
import { Heart, User, Calendar, Clock, Users, Activity, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { doctorDashboardAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { socket, isConnected, joinDoctorRoom, emitAppointmentUpdate } = useSocket()

  // Mock doctor ID - in real app, this would come from authentication
  const doctorId = '507f1f77bcf86cd799439011' // This should be the actual doctor's ID

  useEffect(() => {
    fetchAppointments()
    fetchStats()
    
    // Join doctor room for real-time updates
    if (socket && doctorId) {
      joinDoctorRoom(doctorId)
    }
  }, [doctorId, selectedDate, selectedStatus])

  useEffect(() => {
    if (socket) {
      socket.on('queue-updated', handleQueueUpdate)
      return () => {
        socket.off('queue-updated', handleQueueUpdate)
      }
    }
  }, [socket])

  const fetchAppointments = async () => {
    try {
      const response = await doctorDashboardAPI.getAppointments(doctorId, {
        date: selectedDate,
        status: selectedStatus
      })
      setAppointments(response.data.appointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await doctorDashboardAPI.getStats(doctorId)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleQueueUpdate = (data) => {
    fetchAppointments()
    fetchStats()
    toast.success('Queue updated!')
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await doctorDashboardAPI.updateStatus(appointmentId, { status: newStatus })
      
      // Emit real-time update
      emitAppointmentUpdate({
        appointmentId,
        doctorId,
        patientId: appointments.find(apt => apt._id === appointmentId)?.patient._id,
        status: newStatus
      })

      toast.success('Status updated successfully')
      fetchAppointments()
      fetchStats()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'in-progress': return '🔄'
      case 'completed': return '✅'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Heart className="w-12 h-12 text-red-500 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">QueueManagement</h1>
              <p className="text-gray-600">Doctor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button
              variant="outline"
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-gray-800">{stats.waiting || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">🔄</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-800">{stats['in-progress'] || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{stats.completed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Wait</p>
                <p className="text-2xl font-bold text-gray-800">{stats.averageWaitTime || 0}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Appointments</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments found for the selected criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Queue</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-2xl font-bold text-blue-600">
                          #{appointment.queueNumber}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-800">
                            {appointment.patient.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.patient.age} years • {appointment.patient.gender}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-800">
                            {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.timeSlot}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">
                            {getStatusIcon(appointment.status)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          {appointment.status === 'waiting' && (
                            <Button
                              onClick={() => handleStatusUpdate(appointment._id, 'in-progress')}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Start
                            </Button>
                          )}
                          {appointment.status === 'in-progress' && (
                            <Button
                              onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Complete
                            </Button>
                          )}
                          {appointment.status === 'waiting' && (
                            <Button
                              onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard

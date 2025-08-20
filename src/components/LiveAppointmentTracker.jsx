import React, { useState, useEffect } from 'react'
import { Clock, User, Stethoscope, Calendar, Phone, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { appointmentsAPI } from '../services/supabaseApi'
import QueueTable from './QueueTable'

const LiveAppointmentTracker = ({ currentUser, appointments }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null)
  const [liveTrackingData, setLiveTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch live tracking data
  useEffect(() => {
    if (currentUser) {
      fetchLiveTrackingData()
    }
  }, [currentUser])

  // Calculate estimated wait time based on queue position
  useEffect(() => {
    if (currentUser && currentUser.queueNumber) {
      // Simple estimation: 15 minutes per person in queue
      const queuePosition = currentUser.queueNumber
      const estimatedMinutes = queuePosition * 15
      setEstimatedWaitTime(estimatedMinutes)
    }
  }, [currentUser])

  const fetchLiveTrackingData = async () => {
    try {
      setLoading(true)
      const response = await appointmentsAPI.getLiveTrackingData()
      if (response.data.hasLiveTracking) {
        setLiveTrackingData(response.data.liveTracker)
      }
    } catch (error) {
      console.error('Error fetching live tracking data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200 shadow-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Appointment</h2>
            <p className="text-gray-600 text-lg">You don't have any active appointments at the moment.</p>
            <p className="text-gray-500 mt-2">Book an appointment to start tracking your queue status.</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    const status = liveTrackingData?.status || currentUser.status
    switch (status) {
      case 'waiting':
        return <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
      case 'in-progress':
        return <AlertCircle className="w-6 h-6 text-blue-600" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      default:
        return <Clock className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusText = () => {
    const status = liveTrackingData?.status || currentUser.status
    switch (status) {
      case 'waiting':
        return 'Waiting in Queue'
      case 'in-progress':
        return 'Currently with Doctor'
      case 'completed':
        return 'Appointment Completed'
      default:
        return 'Scheduled'
    }
  }

  const getStatusColor = () => {
    const status = liveTrackingData?.status || currentUser.status
    switch (status) {
      case 'waiting':
        return 'text-yellow-600 bg-yellow-100'
      case 'in-progress':
        return 'text-blue-600 bg-blue-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Live Appointment Tracker</h2>
          <p className="text-gray-600 text-lg mb-4">Real-time updates on your appointment status</p>
          

        </div>

        {/* Current Time Display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-800">
              {format(currentTime, 'HH:mm:ss')}
            </span>
          </div>
        </div>

        {/* Main Tracking Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-xl font-bold text-gray-800">{getStatusText()}</h3>
                <p className="text-gray-600">Queue #{liveTrackingData?.queueNumber || currentUser.queueNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
              {(liveTrackingData?.status || currentUser.status)?.toUpperCase() || 'SCHEDULED'}
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
                <span className="text-sm font-semibold text-gray-800">{currentUser.name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Doctor</p>
                <span className="text-sm font-semibold text-gray-800">Dr. {currentUser.doctor?.name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Appointment Date</p>
                <span className="text-sm font-semibold text-gray-800">
                  {format(new Date(currentUser.appointmentDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Time Slot</p>
                <span className="text-sm font-semibold text-gray-800">{currentUser.timeSlot}</span>
              </div>
            </div>
          </div>

          {/* Wait Time Estimation */}
          {(liveTrackingData?.estimatedWaitTime || estimatedWaitTime) && (liveTrackingData?.status || currentUser.status) === 'waiting' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Estimated Wait Time</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {liveTrackingData?.estimatedWaitTime || estimatedWaitTime} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar for Waiting Status */}
          {(liveTrackingData?.status || currentUser.status) === 'waiting' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Queue Progress</span>
                <span className="text-sm text-gray-500">Position #{liveTrackingData?.queueNumber || currentUser.queueNumber}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(10, 100 - ((liveTrackingData?.queueNumber || currentUser.queueNumber) * 5))}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Doctor Contact Info */}
          {currentUser.doctor && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Doctor Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{currentUser.doctor.phone || 'Contact reception'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{currentUser.doctor.location || 'Main Clinic'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Queue Table */}
        {currentUser && (
          <div className="mt-6">
            <QueueTable currentUser={currentUser} />
          </div>
        )}

        {/* Recent Appointments Summary */}
        {appointments && appointments.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Appointments</h3>
            <div className="space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} at {appointment.timeSlot}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                    {appointment.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveAppointmentTracker

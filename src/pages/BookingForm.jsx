import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Heart, Calendar, Clock, User, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { doctorsAPI, slotsAPI, appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format, addDays, startOfDay } from 'date-fns'

const BookingForm = ({ onBookingSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchDoctors()
  }, [user, navigate])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDoctor, selectedDate])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll()
      setDoctors(response.data.doctors)
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    }
  }

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await slotsAPI.getAvailable({
        doctorId: selectedDoctor,
        date: selectedDate
      })
      setAvailableSlots(response.data.availableSlots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available slots')
    } finally {
      setLoadingSlots(false)
    }
  }

  const onSubmit = async (data) => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and time slot')
      return
    }

    setIsLoading(true)
    try {
      const response = await appointmentsAPI.book({
        doctorId: selectedDoctor,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot
      })

      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        if (onBookingSuccess) {
          onBookingSuccess()
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate next 30 days for date selection
  const generateDateOptions = () => {
    const dates = []
    for (let i = 0; i < 30; i++) {
      const date = addDays(new Date(), i)
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEE, MMMM d, yyyy')
      })
    }
    return dates
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100'
      case 'in-progress': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Appointment Booking
              </h2>

              {/* User Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-blue-800">{user.name}</p>
                    <p className="text-sm text-blue-600">Age: {user.age} • {user.gender}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                  {doctors.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">Loading doctors...</p>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose a date</option>
                    {generateDateOptions().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-2">Available for next 30 days</p>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-handwriting text-lg">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Select schedule
                  </label>
                  
                  {/* Live Clock */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-sm text-blue-600 font-medium mb-1">Current Time</div>
                      <div className="text-2xl font-bold text-blue-800 font-mono">
                        {currentTime.toLocaleTimeString('en-US', { 
                          hour12: true, 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">Loading available time slots...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No time slots available for the selected date</p>
                      <p className="text-sm text-gray-400 mt-1">Please select a different date or doctor</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="overflow-x-auto pb-2 time-slots-scroll">
                        <div className="flex gap-3 min-w-max">
                          {availableSlots.map((slot) => {
                            const isCurrentTime = currentTime.toLocaleTimeString('en-US', { 
                              hour12: false, 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) === slot.time;
                            
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => setSelectedSlot(slot.time)}
                                disabled={!slot.available}
                                className={`px-6 py-4 rounded-full border-2 transition-all whitespace-nowrap relative font-handwriting text-lg time-slot-button ${
                                  selectedSlot === slot.time
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                                    : slot.available
                                    ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:scale-105 bg-white'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                } ${isCurrentTime ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}
                              >
                                <div className="text-base font-medium">{slot.displayTime}</div>
                                {isCurrentTime && (
                                  <div className="text-xs text-green-600 font-medium mt-1">Current</div>
                                )}
                                {!slot.available && (
                                  <div className="text-xs mt-1">Booked</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Scroll indicator */}
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        ← Scroll to see more time slots →
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !selectedDoctor || !selectedDate || !selectedSlot}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Booking Appointment...</span>
                    </div>
                  ) : !selectedDoctor || !selectedDate || !selectedSlot ? (
                    'Please select doctor, date, and time slot'
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Doctors */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Doctors</h3>
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDoctor === doctor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedDoctor(doctor._id)}
                  >
                    <div className="font-medium text-gray-800">{doctor.name}</div>
                    <div className="text-sm text-gray-600">{doctor.specialization}</div>
                    <div className="text-xs text-gray-500">
                      {doctor.workingHours.start} - {doctor.workingHours.end}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Free consultation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>No registration fees</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Real-time queue updates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingForm

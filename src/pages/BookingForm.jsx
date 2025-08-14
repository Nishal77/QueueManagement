import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Calendar, Clock, User, Phone, Stethoscope, CheckCircle, ArrowRight, ArrowLeft, Loader2, Mail, Shield, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { authAPI, doctorsAPI, slotsAPI, appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import moment from 'moment'

const BookingForm = ({ onBookingSuccess }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { login } = useAuth()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
      otp: '',
      age: '',
      gender: ''
    }
  })

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll()
      setDoctors(response.data.doctors || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    }
  }

  const fetchAvailableSlots = async (date) => {
    if (!selectedDoctor || !date) return
    
    try {
      setLoading(true)
      const response = await slotsAPI.getAvailable({ 
        doctorId: selectedDoctor._id, 
        date: date 
      })
      console.log('Slots response:', response.data)
      setAvailableSlots(response.data.availableSlots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available time slots')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    const { name, phoneNumber } = watch()
    
    if (!name?.trim() || !phoneNumber?.trim()) {
      toast.error('Please enter both name and phone number')
      return
    }

    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.sendOTP({ name, phoneNumber })
      if (response.data.success) {
        setOtpSent(true)
        toast.success('OTP sent successfully!')
        setStep(2)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const { otp, age, gender } = watch()
    
    if (!otp?.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!age || !gender) {
      toast.error('Please enter your age and gender')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.verifyOTP({ 
        phoneNumber: watch('phoneNumber'), 
        otp,
        age: parseInt(age),
        gender
      })
      
      if (response.data.success) {
        // Log the user in with the token and user data
        const userData = {
          _id: response.data.patient.id,
          name: response.data.patient.name,
          phoneNumber: response.data.patient.phoneNumber,
          age: response.data.patient.age,
          gender: response.data.patient.gender,
          isVerified: true
        }
        
        login(userData, response.data.token)
        setOtpVerified(true)
        toast.success('OTP verified successfully!')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId)
    setSelectedDoctor(doctor)
    setSelectedDate('')
    setSelectedSlot('')
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot('')
    fetchAvailableSlots(date)
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select all required fields')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please verify your OTP first')
      return
    }

    try {
      setLoading(true)
      const bookingData = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot
      }

      console.log('Booking data:', bookingData) // Debug log
      console.log('Auth token:', token ? 'Present' : 'Missing') // Debug log
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'None') // Debug log

      const response = await appointmentsAPI.book(bookingData)
      
      console.log('Booking response:', response.data)
      
      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        if (onBookingSuccess) {
          onBookingSuccess(response.data.appointment)
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      console.error('Error status:', error.response?.status) // Debug log
      console.error('Error response:', error.response?.data) // Debug log
      console.error('Error headers:', error.response?.headers) // Debug log
      toast.error(error.response?.data?.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableDates = () => {
    const dates = []
    const today = moment()
    
    for (let i = 0; i < 7; i++) {
      const date = today.clone().add(i, 'days')
      if (date.day() !== 0) { // Exclude Sundays
        dates.push({
          value: date.format('YYYY-MM-DD'),
          label: date.format('ddd, MMM D'),
          isToday: i === 0
        })
      }
    }
    return dates
  }

  const closeModal = () => {
    if (onBookingSuccess) {
      onBookingSuccess(null) // This will close the modal
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">
                Book Your Appointment
              </h2>
              <p className="text-blue-100 text-sm">
                {step === 1 
                  ? 'Enter your details to get started' 
                  : 'Complete your booking process'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-xs mb-1">Current Time</div>
              <div className="text-lg font-bold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                step >= 1 
                  ? 'bg-white border-white text-blue-600' 
                  : 'bg-blue-500/30 border-blue-300 text-white'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="text-xs font-medium">Personal Info</div>
            </div>
            
            <div className="w-16 h-1 bg-white/30 rounded-full">
              <div className={`h-full bg-white rounded-full transition-all duration-500 ${
                step >= 2 ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                step >= 2 
                  ? 'bg-white border-white text-blue-600' 
                  : 'bg-blue-500/30 border-blue-300 text-white'
              }`}>
                {step >= 2 ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div className="text-xs font-medium">Appointment Details</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-150px)]">
          {step === 1 ? (
            // Step 1: Personal Information
            <div className="max-w-xl mx-auto">
              <Card className="border-0 shadow-lg bg-gray-900 text-white">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white mb-2">Personal Information</CardTitle>
                  <CardDescription className="text-sm text-gray-300">Please provide your details to proceed with booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-200 font-semibold text-sm">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name', { required: 'Name is required' })}
                        className="mt-2 h-12 text-sm border-2 border-gray-700 focus:border-blue-500 rounded-lg bg-gray-800 text-white"
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber" className="text-gray-200 font-semibold text-sm">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="Enter 10-digit phone number"
                        {...register('phoneNumber', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Please enter a valid 10-digit phone number'
                          }
                        })}
                        className="mt-2 h-12 text-sm border-2 border-gray-700 focus:border-blue-500 rounded-lg bg-gray-800 text-white"
                      />
                      {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber.message}</p>}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP & Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Step 2: Appointment Details
            <div className="max-w-3xl mx-auto space-y-6">
              {/* OTP Verification Section */}
              <Card className="border-0 shadow-lg bg-gray-900 text-white">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Shield className="w-5 h-5" />
                    <span className="text-lg">OTP Verification</span>
                  </CardTitle>
                  <CardDescription className="text-green-100 text-sm">
                    Enter the 6-digit OTP sent to {watch('phoneNumber')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="otp" className="text-gray-200 font-semibold text-sm">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        {...register('otp', { 
                          required: 'OTP is required',
                          pattern: {
                            value: /^[0-9]{6}$/,
                            message: 'Please enter a valid 6-digit OTP'
                          }
                        })}
                        className="mt-2 h-12 text-lg text-center tracking-widest border-2 border-gray-700 focus:border-green-500 rounded-lg bg-gray-800 text-white"
                      />
                      {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="age" className="text-gray-200 font-semibold text-sm">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter your age"
                        {...register('age', { 
                          required: 'Age is required',
                          min: { value: 1, message: 'Age must be at least 1' },
                          max: { value: 120, message: 'Age must be less than 120' }
                        })}
                        className="mt-2 h-12 text-sm border-2 border-gray-700 focus:border-green-500 rounded-lg bg-gray-800 text-white"
                      />
                      {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="gender" className="text-gray-200 font-semibold text-sm">Gender</Label>
                      <Select onValueChange={(value) => setValue('gender', value)}>
                        <SelectTrigger className="mt-2 h-12 text-sm border-2 border-gray-700 focus:border-green-500 rounded-lg bg-gray-800 text-white">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otpVerified}
                    className={`w-full h-12 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                      otpVerified 
                        ? 'bg-green-600 text-white cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : otpVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        OTP Verified ✓
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Appointment Selection Section */}
              {otpVerified && (
                <>
                  {/* Doctor Selection */}
                  <Card className="border-0 shadow-lg bg-gray-900 text-white">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-lg">
                      <CardTitle className="flex items-center space-x-2 text-white">
                        <Stethoscope className="w-5 h-5" />
                        <span className="text-lg">Select Doctor</span>
                      </CardTitle>
                      <CardDescription className="text-purple-100 text-sm">Choose your preferred healthcare provider</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Select onValueChange={handleDoctorSelect}>
                        <SelectTrigger className="h-12 text-sm border-2 border-gray-700 focus:border-purple-500 rounded-lg bg-gray-800 text-white">
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              <div className="flex items-center space-x-3 py-2">
                                <Stethoscope className="w-4 h-4 text-purple-600" />
                                <div>
                                  <div className="font-semibold">Dr. {doctor.name}</div>
                                  <div className="text-sm text-gray-500">{doctor.specialization}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Date Selection */}
                  <Card className="border-0 shadow-lg bg-gray-900 text-white">
                    <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-t-lg">
                      <CardTitle className="flex items-center space-x-2 text-white">
                        <Calendar className="w-5 h-5" />
                        <span className="text-lg">Select Date</span>
                      </CardTitle>
                      <CardDescription className="text-orange-100 text-sm">Choose your preferred appointment date</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Select onValueChange={handleDateSelect}>
                        <SelectTrigger className="h-12 text-sm border-2 border-gray-700 focus:border-orange-500 rounded-lg bg-gray-800 text-white">
                          <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableDates().map((date) => (
                            <SelectItem key={date.value} value={date.value}>
                              <div className="flex items-center space-x-3 py-2">
                                <Calendar className="w-4 h-4 text-orange-600" />
                                <div>
                                  <div className="font-semibold">{date.label}</div>
                                  {date.isToday && <div className="text-sm text-green-600">Today</div>}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Time Selection */}
                  {selectedDate && (
                    <Card className="border-0 shadow-lg bg-gray-900 text-white">
                      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-t-lg">
                        <CardTitle className="flex items-center space-x-2 text-white">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg">Select Time</span>
                        </CardTitle>
                        <CardDescription className="text-indigo-100 text-sm">Choose your preferred time slot</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-sm text-gray-400">Loading available slots...</span>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 mb-2">No available slots for this date</p>
                            <p className="text-gray-500 text-xs">Please select a different date</p>
                          </div>
                        ) : (
                          <Select onValueChange={handleSlotSelect}>
                            <SelectTrigger className="h-12 text-sm border-2 border-gray-700 focus:border-indigo-500 rounded-lg bg-gray-800 text-white">
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.map((slot) => (
                                <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                                  <div className="flex items-center space-x-3 py-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    <div>
                                      <div className="font-semibold">{slot.displayTime}</div>
                                      {!slot.available && <div className="text-sm text-red-500">Booked</div>}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Booking Summary */}
                  {selectedDoctor && selectedDate && selectedSlot && (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-600">
                      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-lg">Appointment Summary</span>
                        </CardTitle>
                        <CardDescription className="text-green-100 text-sm">Review your appointment details</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg shadow-sm">
                            <User className="w-6 h-6 text-blue-400" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Patient</p>
                              <p className="text-sm font-bold text-white">{watch('name')}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg shadow-sm">
                            <Stethoscope className="w-6 h-6 text-purple-400" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Doctor</p>
                              <p className="text-sm font-bold text-white">Dr. {selectedDoctor.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg shadow-sm">
                            <Calendar className="w-6 h-6 text-orange-400" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Date</p>
                              <p className="text-sm font-bold text-white">{moment(selectedDate).format('MMM DD, YYYY')}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg shadow-sm">
                            <Clock className="w-6 h-6 text-indigo-400" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Time</p>
                              <p className="text-sm font-bold text-white">{selectedSlot}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Final Booking Button */}
                  {selectedDoctor && selectedDate && selectedSlot && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={handleBooking}
                        disabled={loading}
                        className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Booking Your Appointment...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Confirm & Book Appointment
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Back Button */}
                  <div className="text-center pt-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="px-6 py-2 text-sm rounded-lg border-2 hover:bg-gray-800 text-white border-gray-600"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Personal Info
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingForm

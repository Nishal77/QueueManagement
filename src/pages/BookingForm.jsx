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

    try {
      setLoading(true)
      const bookingData = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        patientName: watch('name'),
        patientPhone: watch('phoneNumber')
      }

      const response = await appointmentsAPI.book(bookingData)
      
      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        if (onBookingSuccess) {
          onBookingSuccess(response.data.appointment)
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Book Your Appointment
              </h2>
              <p className="text-blue-100 text-lg">
                {step === 1 
                  ? 'Enter your details to get started' 
                  : 'Complete your booking process'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm mb-1">Current Time</div>
              <div className="text-2xl font-bold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-300 ${
                step >= 1 
                  ? 'bg-white border-white text-blue-600' 
                  : 'bg-blue-500/30 border-blue-300 text-white'
              }`}>
                {step > 1 ? <CheckCircle className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>
              <div className="text-sm font-medium">Personal Info</div>
            </div>
            
            <div className="w-20 h-1 bg-white/30 rounded-full">
              <div className={`h-full bg-white rounded-full transition-all duration-500 ${
                step >= 2 ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-300 ${
                step >= 2 
                  ? 'bg-white border-white text-blue-600' 
                  : 'bg-blue-500/30 border-blue-300 text-white'
              }`}>
                {step >= 2 ? <CheckCircle className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
              </div>
              <div className="text-sm font-medium">Appointment Details</div>
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
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 ? (
            // Step 1: Personal Information
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center pb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Personal Information</CardTitle>
                  <CardDescription className="text-lg text-gray-600">Please provide your details to proceed with booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-700 font-semibold text-lg">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name', { required: 'Name is required' })}
                        className="mt-3 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber" className="text-gray-700 font-semibold text-lg">Phone Number</Label>
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
                        className="mt-3 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                      {errors.phoneNumber && <p className="text-red-500 text-sm mt-2">{errors.phoneNumber.message}</p>}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP & Continue
                        <ArrowRight className="w-6 h-6 ml-3" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Step 2: Appointment Details
            <div className="max-w-4xl mx-auto space-y-8">
              {/* OTP Verification Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-3 text-green-800">
                    <Shield className="w-7 h-7" />
                    <span className="text-2xl">OTP Verification</span>
                  </CardTitle>
                  <CardDescription className="text-green-700 text-lg">
                    Enter the 6-digit OTP sent to {watch('phoneNumber')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="otp" className="text-gray-700 font-semibold text-lg">Enter OTP</Label>
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
                        className="mt-3 h-14 text-2xl text-center tracking-widest border-2 border-gray-200 focus:border-green-500 rounded-xl"
                      />
                      {errors.otp && <p className="text-red-500 text-sm mt-2">{errors.otp.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="age" className="text-gray-700 font-semibold text-lg">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter your age"
                        {...register('age', { 
                          required: 'Age is required',
                          min: { value: 1, message: 'Age must be at least 1' },
                          max: { value: 120, message: 'Age must be less than 120' }
                        })}
                        className="mt-3 h-14 text-lg border-2 border-gray-200 focus:border-green-500 rounded-xl"
                      />
                      {errors.age && <p className="text-red-500 text-sm mt-2">{errors.age.message}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="gender" className="text-gray-700 font-semibold text-lg">Gender</Label>
                      <Select onValueChange={(value) => setValue('gender', value)}>
                        <SelectTrigger className="mt-3 h-14 text-lg border-2 border-gray-200 focus:border-green-500 rounded-xl">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-red-500 text-sm mt-2">{errors.gender.message}</p>}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otpVerified}
                    className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                      otpVerified 
                        ? 'bg-green-600 text-white cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : otpVerified ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        OTP Verified ✓
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Appointment Selection Section */}
              {otpVerified && (
                <>
                  {/* Doctor Selection */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
                      <CardTitle className="flex items-center space-x-3 text-purple-800">
                        <Stethoscope className="w-7 h-7" />
                        <span className="text-2xl">Select Doctor</span>
                      </CardTitle>
                      <CardDescription className="text-purple-700 text-lg">Choose your preferred healthcare provider</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <Select onValueChange={handleDoctorSelect}>
                        <SelectTrigger className="h-14 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl">
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              <div className="flex items-center space-x-3 py-2">
                                <Stethoscope className="w-5 h-5 text-purple-600" />
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
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-xl">
                      <CardTitle className="flex items-center space-x-3 text-orange-800">
                        <Calendar className="w-7 h-7" />
                        <span className="text-2xl">Select Date</span>
                      </CardTitle>
                      <CardDescription className="text-orange-700 text-lg">Choose your preferred appointment date</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <Select onValueChange={handleDateSelect}>
                        <SelectTrigger className="h-14 text-lg border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                          <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableDates().map((date) => (
                            <SelectItem key={date.value} value={date.value}>
                              <div className="flex items-center space-x-3 py-2">
                                <Calendar className="w-5 h-5 text-orange-600" />
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
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
                        <CardTitle className="flex items-center space-x-3 text-indigo-800">
                          <Clock className="w-7 h-7" />
                          <span className="text-2xl">Select Time</span>
                        </CardTitle>
                        <CardDescription className="text-indigo-700 text-lg">Choose your preferred time slot</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8">
                        {loading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                            <span className="ml-4 text-lg text-gray-600">Loading available slots...</span>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-12">
                            <Clock className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg text-gray-600 mb-2">No available slots for this date</p>
                            <p className="text-gray-500">Please select a different date</p>
                          </div>
                        ) : (
                          <Select onValueChange={handleSlotSelect}>
                            <SelectTrigger className="h-14 text-lg border-2 border-gray-200 focus:border-indigo-500 rounded-xl">
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.map((slot) => (
                                <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                                  <div className="flex items-center space-x-3 py-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
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
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
                        <CardTitle className="flex items-center space-x-3">
                          <CheckCircle className="w-7 h-7" />
                          <span className="text-2xl">Appointment Summary</span>
                        </CardTitle>
                        <CardDescription className="text-green-100 text-lg">Review your appointment details</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                            <User className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Patient</p>
                              <p className="text-lg font-bold text-gray-800">{watch('name')}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                            <Stethoscope className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Doctor</p>
                              <p className="text-lg font-bold text-gray-800">Dr. {selectedDoctor.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                            <Calendar className="w-8 h-8 text-orange-600" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Date</p>
                              <p className="text-lg font-bold text-gray-800">{moment(selectedDate).format('MMM DD, YYYY')}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                            <Clock className="w-8 h-8 text-indigo-600" />
                            <div>
                              <p className="text-sm text-gray-500 font-medium">Time</p>
                              <p className="text-lg font-bold text-gray-800">{selectedSlot}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Final Booking Button */}
                  {selectedDoctor && selectedDate && selectedSlot && (
                    <div className="text-center pt-6">
                      <Button
                        onClick={handleBooking}
                        disabled={loading}
                        className="h-16 px-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl font-bold rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                            Booking Your Appointment...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-7 h-7 mr-3" />
                            Confirm & Book Appointment
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Back Button */}
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="px-8 py-3 text-lg rounded-xl border-2 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
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

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Calendar, Clock, User, Phone, Stethoscope, CheckCircle, ArrowRight, ArrowLeft, Loader2, Mail, Shield, X, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { authAPI, doctorsAPI, slotsAPI, appointmentsAPI } from '../services/supabaseApi'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
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
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
      otp: '',
      age: '',
      gender: '',
      doctorId: '',
      appointmentDate: '',
      timeSlot: ''
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
      if (response && response.data && response.data.success) {
        setDoctors(response.data.doctors || [])
      } else {
        setDoctors([])
        toast.error('Failed to load doctors')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
      toast.error('Failed to load doctors')
    }
  }

  const fetchAvailableSlots = async (date) => {
    if (!selectedDoctor || !date) return
    
    try {
      setLoading(true)
      
      // Generate local slots for testing
      const testSlots = []
      for (let hour = 9; hour < 13; hour++) {
        for (let minute = 0; minute < 60; minute += 20) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          let displayHour = hour
          let ampm = 'AM'
          
          if (hour === 12) {
            displayHour = 12
            ampm = 'PM'
          } else if (hour > 12) {
            displayHour = hour - 12
            ampm = 'PM'
          }
          
          const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
          testSlots.push({ time: timeSlot, displayTime, available: true })
        }
      }
      
      const response = await slotsAPI.getAvailable({ 
        doctorId: selectedDoctor.id, 
        date: date 
      })
      
      if (response && response.data && response.data.success) {
        setAvailableSlots(response.data.availableSlots || [])
      } else {
        setAvailableSlots(testSlots)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      // Generate fallback slots
      const fallbackSlots = []
      for (let hour = 9; hour < 13; hour++) {
        for (let minute = 0; minute < 60; minute += 20) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          let displayHour = hour
          let ampm = 'AM'
          
          if (hour === 12) {
            displayHour = 12
            ampm = 'PM'
          } else if (hour > 12) {
            displayHour = hour - 12
            ampm = 'PM'
          }
          
          const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
          fallbackSlots.push({ time: timeSlot, displayTime, available: true })
        }
      }
      setAvailableSlots(fallbackSlots)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    const { name, phoneNumber } = form.getValues()
    
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
        toast.success('OTP sent successfully! Check console for OTP code.')
        setStep(2)
        
        if (response.data.otp) {
          console.log('🔑 OTP Code for testing:', response.data.otp)
        }
      } else {
        toast.error(response.data.message || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const { otp, age, gender, name } = form.getValues()
    
    if (!otp?.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!name?.trim() || !age || !gender) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const verifyData = {
        phoneNumber: form.getValues('phoneNumber'), 
        name: form.getValues('name'),
        otp,
        age: parseInt(age),
        gender
      }
      
      const response = await authAPI.verifyOTP(verifyData)
      
      if (response.data.success) {
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
        setStep(3)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error(error.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    setSelectedDoctor(doctor)
    form.setValue('doctorId', doctorId)
    setSelectedDate('')
    setSelectedSlot('')
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    form.setValue('appointmentDate', date)
    setSelectedSlot('')
    
    if (selectedDoctor) {
      fetchAvailableSlots(date)
    }
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    form.setValue('timeSlot', slot)
  }

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select all required fields')
      return
    }

    const token = localStorage.getItem('token')
    if (!token || !user) {
      toast.error('Please verify your OTP first')
      return
    }

    try {
      setLoading(true)
      
      const bookingData = {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        patientName: user.name || form.getValues('name'),
        patientPhone: user.phoneNumber || form.getValues('phoneNumber'),
        patientAge: user.age || form.getValues('age'),
        patientGender: user.gender || form.getValues('gender')
      }

      const response = await appointmentsAPI.book(bookingData)
      
      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        
        if (onBookingSuccess) {
          onBookingSuccess(response.data.appointment)
        }
        
        // Redirect to user dashboard
        navigate('/dashboard')
      } else {
        toast.error(response.data.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Failed to book appointment')
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
      onBookingSuccess(null)
    }
  }

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'OTP Verification', icon: Shield },
    { id: 3, title: 'Doctor & Details', icon: Stethoscope },
    { id: 4, title: 'Date & Time', icon: Calendar },
    { id: 5, title: 'Confirmation', icon: CheckCircle }
  ]

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f8fafc] via-[#a7f3d0] to-[#a7f3d0] backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-white border-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-green-100 to-purple-100 rounded-full opacity-20"></div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white p-6 flex-shrink-0 relative overflow-hidden">
          {/* Header Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(218, 95, 95, 0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Book Appointment
              </h2>
              <p className="text-gray-300 text-sm mt-1">Step {step} of 5 • Complete your booking</p>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs font-medium">Current Time</div>
              <div className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Steps */}
          <div className="flex items-center justify-between relative z-10">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 transform hover:scale-110 ${
                  step >= stepItem.id 
                    ? 'bg-gradient-to-br from-white to-gray-100 text-black border-white shadow-lg' 
                    : 'bg-transparent text-gray-400 border-gray-400'
                }`}>
                  <stepItem.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all duration-500 rounded-full ${
                    step > stepItem.id ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gray-600'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 text-white hover:text-gray-300 transition-all duration-300 z-20 bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Enhanced Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-white to-gray-50">
          <Form {...form}>
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Personal Information</h3>
                  <p className="text-gray-600">Enter your details to get started with your appointment</p>
                </div>
                
                <div className="space-y-6 max-w-lg mx-auto">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-bold mb-2 block">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm hover:shadow-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    rules={{ 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-bold mb-2 block">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 10-digit phone number"
                            maxLength="10"
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm hover:shadow-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl  text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      Send OTP & Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">OTP Verification</h3>
                  <p className="text-gray-600">Enter the 6-digit OTP sent to {form.getValues('phoneNumber')}</p>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="otp"
                    rules={{ 
                      required: 'OTP is required',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Please enter a valid 6-digit OTP'
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-bold mb-2 block">Enter OTP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-center tracking-widest focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm hover:shadow-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      rules={{ 
                        required: 'Age is required',
                        min: { value: 1, message: 'Age must be at least 1' },
                        max: { value: 120, message: 'Age must be less than 120' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-semibold">Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Age"
                              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-black transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      rules={{ required: 'Gender is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-semibold">Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-black transition-all">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl  text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                    ) : (
                      <>
                        Verify OTP & Continue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="w-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Select Doctor</h3>
                  <p className="text-gray-600">Choose your preferred healthcare provider</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="doctorId"
                  rules={{ required: 'Please select a doctor' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-bold mb-2 block">Doctor</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value)
                        handleDoctorSelect(value)
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm hover:shadow-md">
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              <div className="flex items-center space-x-3 py-2">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                  <Stethoscope className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold"> {doctor.name}</div>
                                  <div className="text-sm text-gray-500">{doctor.specialization} • Room {doctor.room}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  onClick={() => setStep(4)}
                  disabled={!selectedDoctor}
                  className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white py-4 rounded-2xl  text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Continue to Date & Time
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="w-full border-3 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 py-4 rounded-2xl text-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-5 h-5 mr-3" />
                  Back
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Select Date & Time</h3>
                  <p className="text-gray-600">Choose your preferred appointment slot</p>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    rules={{ required: 'Please select a date' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-bold text-lg mb-3 block">Date</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value)
                          handleDateSelect(value)
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-3 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:border-black focus:ring-4 focus:ring-black/10 transition-all duration-300 shadow-sm hover:shadow-md">
                              <SelectValue placeholder="Select date" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableDates().map((date) => (
                              <SelectItem key={date.value} value={date.value}>
                                <div className="flex items-center space-x-3 py-2">
                                  <Calendar className="w-5 h-5 text-gray-500" />
                                  <div>
                                    <div className="font-semibold">{date.label}</div>
                                    {date.isToday && <div className="text-sm text-green-600">Today</div>}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedDate && (
                    <FormField
                      control={form.control}
                      name="timeSlot"
                      rules={{ required: 'Please select a time slot' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-bold text-lg mb-3 block">Time Slot</FormLabel>
                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-black"></div>
                              <span className="ml-4 text-gray-600 text-lg">Loading available slots...</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {availableSlots.map((slot) => {
                                  const isSelected = field.value === slot.time;
                                  const isBooked = !slot.available;
                                  
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => {
                                        if (slot.available) {
                                          field.onChange(slot.time);
                                          handleSlotSelect(slot.time);
                                        }
                                      }}
                                      disabled={isBooked}
                                      className={`
                                        relative p-4 rounded-2xl border-3 transition-all duration-300 transform hover:scale-105
                                        ${isSelected 
                                          ? 'bg-gradient-to-r from-black to-gray-800 text-white border-black shadow-xl' 
                                          : isBooked
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                            : 'bg-white text-black border-gray-200 hover:border-black hover:shadow-lg'
                                        }
                                      `}
                                    >
                                      <div className="flex items-center justify-center space-x-2">
                                        <Clock className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                        <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-black'}`}>
                                          {slot.displayTime}
                                        </span>
                                      </div>
                                      
                                      {isSelected && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                          <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                      )}
                                      
                                      {isBooked && (
                                        <div className="absolute inset-0 bg-red-500/10 rounded-2xl flex items-center justify-center">
                                          <span className="text-red-500 text-xs font-bold">BOOKED</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {field.value && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl">
                                  <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <div>
                                      <div className="font-bold text-green-800">Selected Time</div>
                                      <div className="text-green-600">
                                        {availableSlots.find(slot => slot.time === field.value)?.displayTime}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <Button
                  onClick={() => setStep(5)}
                  disabled={!selectedDate || !selectedSlot}
                  className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Review & Confirm
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="w-full border-3 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-5 h-5 mr-3" />
                  Back
                </Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-3">Confirm Appointment</h3>
                  <p className="text-gray-600 text-lg">Review your appointment details</p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-3 border-gray-200 rounded-2xl p-8 shadow-lg">
                    <h4 className="font-bold text-black text-xl mb-6 flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      Appointment Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Patient Name:</span>
                          <span className="font-bold text-black">{form.getValues('name')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <span className="font-bold text-black">{form.getValues('phoneNumber')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Doctor:</span>
                          <span className="font-bold text-black">Dr. {selectedDoctor?.name}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Specialization:</span>
                          <span className="font-bold text-black">{selectedDoctor?.specialization}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Date:</span>
                          <span className="font-bold text-black">{moment(selectedDate).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-gray-600 font-medium">Time:</span>
                          <span className="font-bold text-black">{selectedSlot}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-white mx-auto"></div>
                  ) : (
                    <>
                      Confirm & Book Appointment
                      <CheckCircle className="w-7 h-7 ml-3" />
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setStep(4)}
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  )
}

export default BookingForm

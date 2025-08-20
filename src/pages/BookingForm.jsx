import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Calendar, Clock, User, Phone, Stethoscope, CheckCircle, ArrowRight, ArrowLeft, Loader2, Mail, Shield, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { authAPI, doctorsAPI, slotsAPI, appointmentsAPI } from '../services/supabaseApi'
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
  const { login, user } = useAuth()

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
      console.log('👨‍⚕️ Doctors API response:', response)
      
      if (response && response.data && response.data.success) {
        const doctorsList = response.data.doctors || []
        console.log('✅ Doctors loaded:', doctorsList)
        console.log('🔍 Doctor structure check:')
        doctorsList.forEach((doctor, index) => {
          console.log(`  Doctor ${index + 1}:`, {
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization
          })
        })
        setDoctors(doctorsList)
      } else {
        console.error('❌ Doctors API returned error:', response)
        setDoctors([])
        toast.error('Failed to load doctors')
      }
    } catch (error) {
      console.error('❌ Error fetching doctors:', error)
      setDoctors([])
      toast.error('Failed to load doctors')
    }
  }

  const fetchAvailableSlots = async (date) => {
    console.log('🔍 fetchAvailableSlots called with:')
    console.log('  Date:', date)
    console.log('  Selected Doctor:', selectedDoctor)
    console.log('  Doctor ID:', selectedDoctor?.id)
    
    if (!selectedDoctor || !date) {
      console.log('❌ Missing required data:')
      console.log('  selectedDoctor:', selectedDoctor)
      console.log('  date:', date)
      return
    }
    
    try {
      setLoading(true)
      
      // Test: Generate slots locally first to verify the logic
      console.log('🧪 Testing local slot generation...')
      const testSlots = []
      for (let hour = 9; hour < 13; hour++) { // Changed from 12 to 13
        for (let minute = 0; minute < 60; minute += 10) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // Format display time properly
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
      console.log('✅ Local test slots generated:', testSlots.length)
      
      const response = await slotsAPI.getAvailable({ 
        doctorId: selectedDoctor.id, 
        date: date 
      })
      console.log('📅 Slots API response:', response)
      
      if (response && response.data && response.data.success) {
        const slots = response.data.availableSlots || []
        console.log('✅ Available slots from API:', slots)
        setAvailableSlots(slots)
      } else {
        console.error('❌ Slots API returned error:', response)
        console.log('⚠️ Falling back to local slots')
        setAvailableSlots(testSlots)
        toast.error('Failed to load available time slots from API, using local slots')
      }
    } catch (error) {
      console.error('❌ Error fetching slots:', error)
      console.log('⚠️ Falling back to local slots')
              // Generate fallback slots
        const fallbackSlots = []
        for (let hour = 9; hour < 13; hour++) { // Changed from 12 to 13
          for (let minute = 0; minute < 60; minute += 10) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            
            // Format display time properly
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
      
      // Show loading toast
      toast.loading('📱 Sending OTP...', { duration: 2000 })
      
      console.log('📱 Sending OTP to:', phoneNumber)
      console.log('👤 Name:', name)
      
      const response = await authAPI.sendOTP({ name, phoneNumber })
      console.log('📤 OTP API Response:', response)
      
      if (response.data.success) {
        setOtpSent(true)
        // Success toast with better styling
        toast.success('📱 OTP sent successfully! Check console for OTP code.', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px'
          }
        })
        setStep(2)
        
        // Log the OTP for testing (remove in production)
        if (response.data.otp) {
          console.log('🔑 OTP Code for testing:', response.data.otp)
          console.log('📱 Enter this code to verify:', response.data.otp)
        }
      } else {
        // Error from API response
        toast.error(`❌ ${response.data.message || 'Failed to send OTP'}`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px'
          }
        })
      }
    } catch (error) {
      console.error('❌ Error sending OTP:', error)
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to send OTP'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.code) {
        errorMessage = `Error ${error.code}: ${error.message || 'Unknown error'}`
      }
      
      toast.error(`❌ ${errorMessage}`, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '16px',
          padding: '16px',
          borderRadius: '8px'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const { otp, age, gender, name } = watch()
    
    if (!otp?.trim() || otp.length !== 6) {
      toast.error('❌ Please enter a valid 6-digit OTP', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }

    if (!name?.trim()) {
      toast.error('❌ Please enter your name', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }

    if (!age || !gender) {
      toast.error('❌ Please enter your age and gender', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }
    
    console.log('🔍 Form validation passed:')
    console.log('  Name:', name)
    console.log('  Age:', age)
    console.log('  Gender:', gender)
    console.log('  OTP:', otp)

    try {
      setLoading(true)
      
      const verifyData = {
        phoneNumber: watch('phoneNumber'), 
        name: watch('name'),
        otp,
        age: parseInt(age),
        gender
      }
      
      console.log('🔐 Verifying OTP with data:', verifyData)
      console.log('📱 Phone:', verifyData.phoneNumber)
      console.log('👤 Name:', verifyData.name)
      console.log('🔑 OTP:', verifyData.otp)
      console.log('👤 Age:', verifyData.age)
      console.log('🚻 Gender:', verifyData.gender)
      
      const response = await authAPI.verifyOTP(verifyData)
      
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
        // Success toast with better styling
        toast.success('✅ OTP verified successfully! You can now book appointments.', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px'
          }
        })
        setLoading(false)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId) => {
    console.log('👨‍⚕️ Doctor selected:', doctorId)
    const doctor = doctors.find(d => d.id === doctorId)
    console.log('👨‍⚕️ Found doctor:', doctor)
    setSelectedDoctor(doctor)
    setSelectedDate('')
    setSelectedSlot('')
    
    // Debug: Check if doctor is properly set
    setTimeout(() => {
      console.log('🔍 Selected doctor after state update:', selectedDoctor)
    }, 100)
  }

  const handleDateSelect = (date) => {
    console.log('📅 Date selected:', date)
    setSelectedDate(date)
    setSelectedSlot('')
    
    // Debug: Check if we have all required data
    console.log('🔍 Before calling fetchAvailableSlots:')
    console.log('  selectedDoctor:', selectedDoctor)
    console.log('  date:', date)
    
    if (selectedDoctor) {
      fetchAvailableSlots(date)
    } else {
      console.log('⚠️ No doctor selected yet, cannot fetch slots')
    }
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('❌ Please select all required fields', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('❌ Please verify your OTP first', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }

    // Validate user data
    if (!user) {
      toast.error('❌ User session not found. Please login again.', {
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px'
        }
      })
      return
    }

    try {
      setLoading(true)
      
      // Show loading toast
      toast.loading('Booking your appointment...', { duration: 2000 })
      
      const bookingData = {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        patientName: user.name || watch('name'),
        patientPhone: user.phoneNumber || watch('phoneNumber'),
        patientAge: user.age || watch('age'),
        patientGender: user.gender || watch('gender')
      }

      console.log('📝 Booking data:', bookingData)
      console.log('👤 User data:', user)
      console.log('🔑 Auth token:', token ? 'Present' : 'Missing')

      const response = await appointmentsAPI.book(bookingData)
      
      console.log('✅ Booking response:', response.data)
      
      if (response.data.success) {
        // Success toast with better styling
        toast.success('🎉 Appointment booked successfully!', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px'
          }
        })
        
        if (onBookingSuccess) {
          onBookingSuccess(response.data.appointment)
        }
      } else {
        // Error from API response
        toast.error(`❌ ${response.data.message || 'Failed to book appointment'}`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px'
          }
        })
      }
    } catch (error) {
      console.error('❌ Error booking appointment:', error)
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to book appointment'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.code) {
        errorMessage = `Error ${error.code}: ${error.message || 'Unknown error'}`
      }
      
      toast.error(`❌ ${errorMessage}`, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '16px',
          padding: '16px',
          borderRadius: '8px'
        }
      })
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white/10 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">
                Book Appointment
              </h2>
              <p className="text-gray-600 text-xs">
                {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-xs">Time</div>
              <div className="text-sm font-bold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-black h-1 rounded-full transition-all duration-500" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>



        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            // Step 1: Personal Information
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Personal Information</h3>
                <p className="text-xs text-gray-400">Enter your details to continue</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder-gray-500 text-sm"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    {...register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder-gray-500 text-sm"
                  />
                  {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber.message}</p>}
                </div>
              </div>
              
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-white text-black py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:bg-gray-100"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-400">
                  We'll send a verification code to your phone number
                </p>
              </div>
            </div>
          ) : (
            // Step 2: Appointment Details
            <div className="space-y-6">
              {/* OTP Verification Section */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">OTP Verification</h3>
                  <p className="text-xs text-gray-400">Enter the 6-digit OTP sent to {watch('phoneNumber')}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white mb-2">
                      Enter OTP
                    </label>
                    <input
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
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder-gray-500 text-center text-lg tracking-widest"
                    />
                    {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="Age"
                        {...register('age', { 
                          required: 'Age is required',
                          min: { value: 1, message: 'Age must be at least 1' },
                          max: { value: 120, message: 'Age must be less than 120' }
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder-gray-500 text-sm"
                      />
                      {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-white mb-2">
                        Gender
                      </label>
                      <Select onValueChange={(value) => setValue('gender', value)}>
                        <SelectTrigger className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white text-sm">
                          <SelectValue placeholder="Select" />
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
                    className={`w-full bg-white text-black py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:bg-gray-100 ${
                      otpVerified ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    ) : otpVerified ? (
                      <>
                        Verified
                      </>
                    ) : (
                      <>
                        Verify OTP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Appointment Selection Section */}
              {otpVerified && (
                <>
                  {/* Doctor Selection */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1">Select Doctor</h3>
                      <p className="text-xs text-gray-400">Choose your preferred healthcare provider</p>
                    </div>
                    
                    <Select onValueChange={handleDoctorSelect}>
                      <SelectTrigger className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white text-sm">
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            <div className="flex items-center space-x-3 py-2">
                              <div>
                                <div className="font-semibold">Dr. {doctor.name}</div>
                                <div className="text-sm text-gray-500">{doctor.specialization}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date and Day Selection - Horizontal Layout */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1">Select Date & Day</h3>
                      <p className="text-xs text-gray-400">Choose your preferred appointment date and day</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-white mb-2">
                          Date
                        </label>
                        <Select onValueChange={handleDateSelect}>
                          <SelectTrigger className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white text-sm">
                            <SelectValue placeholder="Select date" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableDates().map((date) => (
                              <SelectItem key={date.value} value={date.value}>
                                <div className="flex items-center space-x-3 py-2">
                                  <div>
                                    <div className="font-semibold">{date.label}</div>
                                    {date.isToday && <div className="text-sm text-green-600">Today</div>}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-white mb-2">
                          Day
                        </label>
                        <Select onValueChange={(value) => {
                          // Find the date that corresponds to this day and select it
                          const selectedDayDate = getAvailableDates().find(date => 
                            new Date(date.value).toLocaleDateString('en-US', { weekday: 'long' }) === value
                          );
                          if (selectedDayDate) {
                            handleDateSelect(selectedDayDate.value);
                          }
                        }}>
                          <SelectTrigger className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white text-sm">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableDates().map((date) => (
                              <SelectItem key={date.value} value={new Date(date.value).toLocaleDateString('en-US', { weekday: 'long' })}>
                                <div className="flex items-center space-x-3 py-2">
                                  <div>
                                    <div className="font-semibold">{new Date(date.value).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                    <div className="text-sm text-gray-500">{date.label}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1">Select Time</h3>
                        <p className="text-xs text-gray-400">Choose your preferred time slot</p>
                        <p className="text-xs text-green-400 mt-1">Working Hours: 9:00 AM - 1:00 PM</p>
                      </div>
                      
                      {/* Debug info */}
                      <div className="text-xs text-gray-400 p-2 bg-white/5 rounded border">
                        <p>Debug: {availableSlots.length} slots available</p>
                        <p>Selected Doctor: {selectedDoctor?.name || 'None'} (ID: {selectedDoctor?.id || 'None'})</p>
                        <p>Selected Date: {selectedDate || 'None'}</p>
                        <p>Loading: {loading ? 'Yes' : 'No'}</p>
                        <p>Working Hours: 9:00 AM - 1:00 PM (10-min intervals)</p>
                        <p>Total Slots: {availableSlots.length} (4 hours × 6 slots/hour)</p>
                        <p>Available Slots: {availableSlots.length > 0 ? availableSlots.slice(0, 5).map(s => s.displayTime).join(', ') + (availableSlots.length > 5 ? '...' : '') : 'None'}</p>
                      </div>
                      
                      {loading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span className="ml-3 text-xs text-gray-400">Loading slots...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-400 mb-1">No available slots</p>
                          <p className="text-gray-500 text-xs">Select a different date</p>
                        </div>
                      ) : (
                        <Select onValueChange={handleSlotSelect}>
                          <SelectTrigger className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-white focus:border-white transition-all text-white text-sm">
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                          <SelectContent>
                                                    {availableSlots.map((slot) => {
                          console.log('🎯 Rendering slot:', slot)
                          return (
                            <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                              <div className="flex items-center space-x-3 py-2">
                                <div>
                                  <div className="font-semibold">{slot.displayTime}</div>
                                  <div className="text-xs text-gray-500">Available</div>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Booking Summary */}
                  {selectedDoctor && selectedDate && selectedSlot && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1">Appointment Summary</h3>
                        <p className="text-xs text-gray-400">Review your appointment details</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-xs text-gray-400">Patient</p>
                            <p className="text-sm font-bold text-white">{watch('name')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-xs text-gray-400">Doctor</p>
                            <p className="text-sm font-bold text-white">Dr. {selectedDoctor.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-xs text-gray-400">Date</p>
                            <p className="text-sm font-bold text-white">{moment(selectedDate).format('MMM DD, YYYY')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-xs text-gray-400">Time</p>
                            <p className="text-sm font-bold text-white">{selectedSlot}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Final Booking Button */}
                      <Button
                        onClick={handleBooking}
                        disabled={loading}
                        className="w-full bg-white text-black py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:bg-gray-100"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        ) : (
                          <>
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
                      className="px-4 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/5 text-white transition-all duration-200"
                    >
                      <ArrowLeft className="w-3 h-3 mr-2" />
                      Back
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

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Calendar, Clock, User, Phone, Stethoscope, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
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

  const form = useForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
      otp: ''
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
      const response = await doctorsAPI.get('/')
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
      const response = await slotsAPI.get(`/${selectedDoctor._id}/${date}`)
      setAvailableSlots(response.data.slots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available time slots')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    const { name, phoneNumber } = form.getValues()
    
    if (!name.trim() || !phoneNumber.trim()) {
      toast.error('Please enter both name and phone number')
      return
    }

    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.post('/send-otp', { phoneNumber })
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
    const { otp } = form.getValues()
    
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.post('/verify-otp', { 
        phoneNumber: form.getValues('phoneNumber'), 
        otp 
      })
      
      if (response.data.success) {
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

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor)
    setSelectedDate('')
    setSelectedSlot('')
    setAvailableSlots([])
    setStep(4)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot('')
    fetchAvailableSlots(date)
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    setStep(5)
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
        patientName: form.getValues('name'),
        patientPhone: form.getValues('phoneNumber')
      }

      const response = await appointmentsAPI.post('/', bookingData)
      
      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        if (onBookingSuccess) {
          onBookingSuccess()
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Book Your Appointment</h2>
        <p className="text-gray-600">Enter your details to get started</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    {...field}
                    placeholder="Enter your full name"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    {...field}
                    placeholder="Enter 10-digit phone number"
                    className="pl-10 h-12 text-base"
                    maxLength={10}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button
        onClick={handleSendOTP}
        disabled={loading}
        className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
      >
        {loading ? 'Sending OTP...' : 'Send OTP'}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
        <p className="text-gray-600">Enter the 6-digit OTP sent to your phone</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">OTP Code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter 6-digit OTP"
                  className="h-12 text-base text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1 h-12"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Select Doctor</h2>
        <p className="text-gray-600">Choose your preferred doctor</p>
      </div>

      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <div
            key={doctor._id}
            onClick={() => handleDoctorSelect(doctor)}
            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{doctor.name}</h3>
                <p className="text-gray-600">{doctor.specialization}</p>
                <p className="text-sm text-gray-500">Experience: {doctor.experience}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">₹{doctor.consultationFee}</p>
                <p className="text-sm text-gray-500">Consultation Fee</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setStep(2)}
        className="w-full h-12"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back
      </Button>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Select Date & Time</h2>
        <p className="text-gray-600">Choose your preferred appointment date and time</p>
      </div>

      <div className="space-y-6">
        {/* Date Selection */}
        <div>
          <Label className="text-gray-700 font-medium mb-3 block">Select Date</Label>
          <div className="grid grid-cols-3 gap-3">
            {getAvailableDates().map((date) => (
              <button
                key={date.value}
                onClick={() => handleDateSelect(date.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedDate === date.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-sm font-medium">{date.label.split(',')[0]}</div>
                <div className="text-xs text-gray-500">{date.label.split(',')[1]}</div>
                {date.isToday && (
                  <div className="text-xs text-green-600 font-medium mt-1">Today</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">Select Time</Label>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading available slots...</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
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
                        onClick={() => handleSlotSelect(slot.time)}
                        disabled={!slot.available}
                        className={`px-6 py-4 rounded-full border-2 transition-all whitespace-nowrap relative ${
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
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(3)}
          className="flex-1 h-12"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={() => setStep(5)}
          disabled={!selectedSlot}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Confirm Booking</h2>
        <p className="text-gray-600">Review your appointment details</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-medium text-gray-800">{form.getValues('name')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="font-medium text-gray-800">{form.getValues('phoneNumber')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Stethoscope className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Doctor</p>
            <p className="font-medium text-gray-800">{selectedDoctor?.name} - {selectedDoctor?.specialization}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-800">{moment(selectedDate).format('dddd, MMMM D, YYYY')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium text-gray-800">{moment(`2000-01-01 ${selectedSlot}`).format('h:mm A')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Consultation Fee:</span>
            <span className="text-2xl font-bold text-blue-600">₹{selectedDoctor?.consultationFee}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(4)}
          className="flex-1 h-12"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleBooking}
          disabled={loading}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
          <CheckCircle className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 5 && (
              <div className={`w-16 h-1 mx-2 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Details</span>
        <span>OTP</span>
        <span>Doctor</span>
        <span>Date & Time</span>
        <span>Confirm</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderProgressBar()}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  )
}

export default BookingForm

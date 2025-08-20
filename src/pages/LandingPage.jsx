import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Heart, Phone, User, ArrowRight, Clock, Shield, Zap, Star, ChevronRight, Play, Copy, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { authAPI } from '../services/supabaseApi'
import { useAuth } from '../context/AuthContext'

import toast from 'react-hot-toast'

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const navigate = useNavigate()
  const { setTempData } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.sendOTP(data)

      if (response.data.success) {
        setTempData({ name: data.name, phoneNumber: data.phoneNumber })
        toast.success('OTP sent successfully!')
        navigate('/verify-otp')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative bg-gradient-to-b from-[#f8fafc] via-[#a7f3d0] to-[#38bdf8]">
      {/* Header */}
      <div className="relative z-10 p-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-black text-xl font-bold">QueueSmart</span>
          </div>
          <Button
            onClick={() => navigate('/booking')}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Banner */}
          <div >
            <Button
              onClick={() => navigate('/features')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-black mb-2 hover:bg-black hover:text-white transition-all duration-300"

            ><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>5+ New Features</span>
              <Zap className="w-4 h-4 ml-2 text-black" />
              <span className="ml-2">Read More →</span>

            </Button>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-7xl font-bold text-black mb-6 leading-tight">
            Say Goodbye to
            <span className="block text-gray-600">Long Queues</span>
          </h1>

          {/* Description */}
          <p className="text-lg lg:text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            Experience Faster, Smarter, and Stress-Free Hospital Visits. Professional-grade queue management system with real-time updates and seamless booking.
          </p>

          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              onClick={() => navigate('/booking')}
              className="bg-white text-black hover:bg-black hover:text-white px-8 py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-black/25 transform hover:scale-105 min-w-[280px]"
            >
              <div className="text-left">
                <div className="font-bold text-xl">Book Appointment</div>

              </div>
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black hover:bg-black hover:text-white px-8 py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-black/25 transform hover:scale-105 min-w-[280px]"
            >
              <div className="text-left">
                <div className="font-bold text-xl">Live Preview</div>

              </div>
            </Button>
          </div>

          {/* Secondary Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/doctor')}
              className="bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-black px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center hover:border-gray-400"
            >
              <User className="w-4 h-4 mr-2" />
              Doctor Dashboard
            </Button>


          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

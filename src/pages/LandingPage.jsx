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
    <div className=" relative bg-gradient-to-b from-[#a7f3d0] via-[#a7f3d0] to-[#38bdf8]">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200 p-6">
  <div className="max-w-6xl mx-auto flex items-center justify-between">
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
  onClick={() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }}
  className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-black mb-2 hover:bg-black hover:text-white transition-all duration-300"
>
  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
  <span>2+ New Features</span>
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
     <div>

        
      <section id="features" className="py-20 px-10">
  <h2 className="text-3xl font-bold text-center mb-6">Features</h2>
  <p className="text-center text-gray-600 mb-12">
    Explore some of the powerful tools QueueSmart provides.
  </p>

  <div className="relative z-10 p-10">
    <div className="flex flex-wrap justify-center gap-8">
      {/* Card 1 */}
      <div className="w-80 bg-white/30 backdrop-blur-md shadow-lg rounded-2xl border border-white/20 
                      transition-transform duration-300 ease-out
                      hover:scale-105 hover:-translate-y-2 hover:translate-x-2
                      hover:shadow-2xl hover:shadow-blue-200/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Live Preview</h2>
          <p className="text-gray-600 mt-2">
          <h2>Preview queue status and upcoming appointments in real time.</h2>
          </p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="w-80 bg-white/30 backdrop-blur-md shadow-lg rounded-2xl border border-white/20 
                      transition-transform duration-300 ease-out
                      hover:scale-105 hover:-translate-y-2 hover:translate-x-2
                      hover:shadow-2xl hover:shadow-blue-200/50">
      <div className="p-6">
  <h2 className="text-xl font-bold text-gray-800">
    Real-Time Queue Updates
  </h2>
  <p className="text-gray-600 mt-2">
    Get live updates on your queue status and estimated waiting time.
  </p>
</div>

      </div>

      {/* Card 3 */}
      <div className="w-80 bg-white/30 backdrop-blur-md shadow-lg rounded-2xl border border-white/20 
                      transition-transform duration-300 ease-out
                      hover:scale-105 hover:-translate-y-2 hover:translate-x-2
                      hover:shadow-2xl hover:shadow-blue-200/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Seamless Appointment Booking</h2>
          <p className="text-gray-600 mt-2">
            Book appointments easily and receive instant confirmation.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
</div>





<div> <footer>
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-center">
            &copy; 2025 QueueSmart. All rights reserved.
          </p>
        </div>
      </footer></div>
     
    </div>
  )
}

export default LandingPage

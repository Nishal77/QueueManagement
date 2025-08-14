import { Button } from './ui/button'
import { Heart, Clock, Users, Shield, ArrowRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()

  const handleBookAppointment = () => {
    navigate('/booking')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      
      {/* Book Appointment Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          onClick={handleBookAppointment}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        {/* Main Heading */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Heart className="w-20 h-20 text-red-500 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-2">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Queue
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Management
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Modern hospital appointment booking system with real-time queue tracking. 
            Book your appointment in seconds, track your status live, and experience healthcare like never before.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            onClick={handleBookAppointment}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            className="border-2 border-blue-400 text-blue-300 hover:bg-blue-400 hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-300"
          >
            Learn More
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="bg-blue-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-Time Tracking</h3>
            <p className="text-blue-200">Monitor your appointment status live with instant updates</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="bg-purple-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Expert Doctors</h3>
            <p className="text-blue-200">Choose from our team of experienced healthcare professionals</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <div className="bg-green-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-blue-200">Your health information is protected with bank-level security</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
            <div className="text-blue-200">Happy Patients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
            <div className="text-blue-200">Expert Doctors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
            <div className="text-blue-200">Support</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">99%</div>
            <div className="text-blue-200">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-4 h-4 bg-blue-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute top-1/3 right-20 w-6 h-6 bg-purple-400 rounded-full animate-pulse opacity-40" />
      <div className="absolute bottom-1/4 left-20 w-3 h-3 bg-green-400 rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-1/3 right-10 w-5 h-5 bg-pink-400 rounded-full animate-pulse opacity-30" />
    </div>
  )
}

export default Hero


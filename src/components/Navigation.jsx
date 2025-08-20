import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { BookOpen, User, Home } from 'lucide-react'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b-2 border-black shadow-lg px-6 py-4 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <h1 
            className="text-2xl font-bold text-black cursor-pointer hover:text-gray-700 transition-colors duration-300"
            onClick={() => navigate('/')}
          >
            QueueSmart
          </h1>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 bg-gray-100 border-2 border-gray-200 rounded-xl p-1">         
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all duration-300 ${
                isActive('/') 
                  ? "bg-black text-white shadow-lg" 
                  : "text-gray-700 hover:text-black hover:bg-gray-200"
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate('/booking')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all duration-300 ${
                isActive('/booking') 
                  ? "bg-black text-white shadow-lg" 
                  : "text-gray-700 hover:text-black hover:bg-gray-200"
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/doctor')}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <User className="w-4 h-4 mr-2" />
            Doctor Login
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden mt-4 pt-4 border-t-2 border-gray-200">
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className={`w-full justify-start rounded-lg px-4 py-3 font-semibold transition-all duration-300 ${
              isActive('/') 
                ? "bg-black text-white shadow-lg" 
                : "text-gray-700 hover:text-black hover:bg-gray-100"
            }`}
          >
            <Home className="w-4 h-4 mr-3" />
            Home
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/booking')}
            className={`w-full justify-start rounded-lg px-4 py-3 font-semibold transition-all duration-300 ${
              isActive('/booking') 
                ? "bg-black text-white shadow-lg" 
                : "text-gray-700 hover:text-black hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4 mr-3" />
            Book Appointment
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

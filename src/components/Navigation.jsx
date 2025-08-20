import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 max-w-6xl mx-auto flex justify-between items-center " >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 
            className="text-xl font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate('/')}
          >
            QueueSmart
          </h1>
          
          <div className="flex items-center space-x-2 border shadow-sm rounded-sm bg-gray-100 hover:bg-gray-200 transition-all duration-300  ">         
            <Button
              variant={isActive('/booking') ? "default" : "ghost"}
              onClick={() => navigate('/booking')}
              className={isActive('/booking') ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"}
            >
              Book Appointment
            </Button>            
          </div>
        </div>
    
      </div>
    </nav>
  )
}

export default Navigation

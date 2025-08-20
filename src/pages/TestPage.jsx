import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

const TestPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Test Page
        </h1>
        <p className="text-gray-600 mb-6">
          This is a test page to verify routing is working correctly.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Go to Home (/)
          </Button>
          
          <Button 
            onClick={() => navigate('/doctor')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Go to Doctor (/doctor)
          </Button>
          
          <Button 
            onClick={() => navigate('/booking')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to Booking (/booking)
          </Button>
          
          <Button 
            onClick={() => navigate('/verify-otp')}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Go to OTP (/verify-otp)
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">
            Current URL: {window.location.pathname}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestPage

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Heart, Lock, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const OTPVerification = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()
  const { tempUserData, login, clearTempData } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    if (!tempUserData) {
      navigate('/')
      return
    }

    // Start countdown for resend
    setCountdown(30)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [tempUserData, navigate])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.verifyOTP({
        phoneNumber: tempUserData.phoneNumber,
        otp: data.otp,
        age: data.age,
        gender: data.gender
      })

      if (response.data.success) {
        login(response.data.patient, response.data.token)
        clearTempData()
        toast.success('Verification successful!')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    try {
      const response = await authAPI.resendOTP({
        phoneNumber: tempUserData.phoneNumber
      })

      if (response.data.success) {
        toast.success('OTP resent successfully!')
        setCountdown(30)
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
    } finally {
      setResendLoading(false)
    }
  }

  const handleBack = () => {
    clearTempData()
    navigate('/')
  }

  if (!tempUserData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Heart className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">QueueManagement</h1>
          <p className="text-gray-600">Verify Your Phone Number</p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-semibold text-gray-800 ml-2">
              Complete Registration
            </h2>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Name:</strong> {tempUserData.name}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Phone:</strong> {tempUserData.phoneNumber}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* OTP Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Verification Code
              </label>
              <input
                type="text"
                {...register('otp', { 
                  required: 'OTP is required',
                  pattern: { 
                    value: /^[0-9]{6}$/, 
                    message: 'Please enter a valid 6-digit OTP' 
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg font-mono"
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
              )}
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                {...register('age', { 
                  required: 'Age is required',
                  min: { value: 1, message: 'Age must be at least 1' },
                  max: { value: 120, message: 'Age cannot exceed 120' }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your age"
                min="1"
                max="120"
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
              )}
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
              className="text-sm"
            >
              {resendLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend OTP'
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 text-center">
              Check your phone for the verification code sent via SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification

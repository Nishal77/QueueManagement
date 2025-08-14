import { Heart, Activity } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      {/* Azure Depths */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #010133 100%)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="relative mb-8">
          <Heart className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
          <Activity className="w-8 h-8 text-blue-400 absolute -top-2 -right-2 animate-spin" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">QueueManagement</h1>
        <p className="text-blue-200 mb-8">Hospital Appointment Booking System</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
        <p className="text-sm text-blue-300 mt-4">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

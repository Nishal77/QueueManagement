import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    setSocket(newSocket)

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    if (socket && user) {
      // Join patient room for real-time updates
      socket.emit('join-patient-room', user.id)
    }
  }, [socket, user])

  const joinDoctorRoom = (doctorId) => {
    if (socket) {
      socket.emit('join-doctor-room', doctorId)
    }
  }

  const leaveDoctorRoom = (doctorId) => {
    if (socket) {
      socket.emit('leave-doctor-room', doctorId)
    }
  }

  const emitAppointmentUpdate = (data) => {
    if (socket) {
      socket.emit('appointment-status-updated', data)
    }
  }

  const emitQueueUpdate = (data) => {
    if (socket) {
      socket.emit('queue-updated', data)
    }
  }

  const value = {
    socket,
    isConnected,
    joinDoctorRoom,
    leaveDoctorRoom,
    emitAppointmentUpdate,
    emitQueueUpdate
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

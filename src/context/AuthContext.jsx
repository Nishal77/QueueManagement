import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tempUserData, setTempUserData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    toast.success('Login successful!')
  }

  const logout = () => {
    setUser(null)
    setTempUserData(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/')
  }

  const setTempData = (data) => {
    setTempUserData(data)
  }

  const clearTempData = () => {
    setTempUserData(null)
  }

  const value = {
    user,
    loading,
    tempUserData,
    login,
    logout,
    setTempData,
    clearTempData,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    
    if (error.response?.status !== 404) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  getProfile: () => api.get('/auth/profile')
}

// Doctors API
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getBySpecialization: (specialization) => api.get(`/doctors/specialization/${specialization}`)
}

// Appointments API
export const appointmentsAPI = {
  book: (data) => api.post('/appointments/book', data),
  getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  getCurrentStatus: () => api.get('/appointments/current/status'),
  getLiveTrackingData: () => api.get('/appointments/live-tracking/data'),
  getDoctorQueue: (doctorId) => api.get(`/appointments/doctor/${doctorId}/queue`),
  getAllQueues: () => api.get('/appointments/all-queues'),
  getAllAppointments: () => api.get('/appointments/all'),
  updateAppointmentStatus: (appointmentId, status) => api.patch(`/appointments/${appointmentId}/cancel`, { status })
}

// Time slots API
export const slotsAPI = {
  getAvailable: (params) => api.get('/slots/available', { params })
}

// Doctor Dashboard API
export const doctorDashboardAPI = {
  getAppointments: (doctorId, params) => api.get(`/doctor-dashboard/${doctorId}/appointments`, { params }),
  updateStatus: (appointmentId, data) => api.patch(`/doctor-dashboard/appointments/${appointmentId}/status`, data),
  getTodayQueue: (doctorId) => api.get(`/doctor-dashboard/${doctorId}/queue/today`),
  getStats: (doctorId, params) => api.get(`/doctor-dashboard/${doctorId}/stats`, { params }),
  getNextPatient: (doctorId) => api.get(`/doctor-dashboard/${doctorId}/next-patient`)
}

export default api

import { supabase } from '../lib/supabase'
import twilioService from './twilioService'

// Auth API
export const authAPI = {
  sendOTP: async (data) => {
    try {
      const { phoneNumber, name } = data
      
      // Generate OTP
      const otp = twilioService.generateOTP()
      
      // Send OTP via Twilio
      const result = await twilioService.sendOTP(phoneNumber, otp)
      
      if (result.success) {
        console.log('✅ OTP sent successfully to:', phoneNumber)
        console.log('🔑 OTP for testing:', otp) // Remove this in production
        
        return { 
          data: { 
            success: true, 
            message: 'OTP sent successfully',
            otp: otp // Remove this in production
          } 
        }
      } else {
        console.error('❌ Failed to send OTP:', result.message)
        return { 
          data: { 
            success: false, 
            message: result.message 
          } 
        }
      }
    } catch (error) {
      console.error('❌ Error in sendOTP:', error)
      return { 
        data: { 
          success: false, 
          message: 'Failed to send OTP',
          error: error.message
        } 
      }
    }
  },

  verifyOTP: async (data) => {
    const { phoneNumber, name, age, gender, otp } = data
    
    console.log('🔍 verifyOTP received data:', data)
    console.log('📱 Phone Number:', phoneNumber)
    console.log('👤 Name:', name)
    console.log('👤 Age:', age)
    console.log('🚻 Gender:', gender)
    console.log('🔑 OTP:', otp)
    
    try {
      // First verify the OTP
      const otpResult = await twilioService.verifyOTP(phoneNumber, otp)
      
      if (!otpResult.success) {
        console.error('❌ OTP verification failed:', otpResult.message)
        return {
          data: {
            success: false,
            message: otpResult.message
          }
        }
      }
      
      console.log('✅ OTP verified successfully for:', phoneNumber)
      
      // Validate required fields before database operations
      if (!name || !name.trim()) {
        console.error('❌ Name is required but was empty or null')
        return {
          data: {
            success: false,
            message: 'Name is required'
          }
        }
      }
      
      if (!age || age < 1 || age > 120) {
        console.error('❌ Invalid age:', age)
        return {
          data: {
            success: false,
            message: 'Please enter a valid age between 1 and 120'
          }
        }
      }
      
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        console.error('❌ Invalid gender:', gender)
        return {
          data: {
            success: false,
            message: 'Please select a valid gender'
          }
        }
      }
      
      console.log('✅ All data validation passed, proceeding to database...')
      
      // First check if patient already exists
      console.log('🔍 Checking if patient already exists with phone:', phoneNumber)
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking existing patient:', checkError)
        throw checkError
      }

      let patientId

      if (existingPatient) {
        console.log('🔄 Patient already exists, updating...')
        // Update existing patient
        const { data: updatedPatient, error: updateError } = await supabase
          .from('patients')
          .update({ 
            name: name.trim(), 
            age, 
            gender, 
            is_verified: true,
            updated_at: new Date()
          })
          .eq('id', existingPatient.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating patient:', updateError)
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          })
          throw updateError
        }
        
        patientId = updatedPatient.id
        console.log('✅ Patient updated successfully:', patientId)
      } else {
        console.log('🆕 Creating new patient...')
        // Create new patient
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert([{ 
            name: name.trim(), 
            phone_number: phoneNumber, 
            age, 
            gender, 
            is_verified: true 
          }])
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error creating patient:', insertError)
          console.error('Error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })
          throw insertError
        }
        
        patientId = newPatient.id
        console.log('✅ New patient created successfully:', patientId)
      }

      // patientId is now set from either update or insert operation above

      // Create a simple token (in production, use proper JWT)
      const token = `patient_${patientId}_${Date.now()}`

      return {
        data: {
          success: true,
          message: 'OTP verified successfully',
          token,
          patient: {
            id: patientId,
            name: name.trim(),
            phoneNumber,
            age,
            gender,
            isVerified: true
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in verifyOTP:', error)
      return {
        data: {
          success: false,
          message: 'Verification failed',
          error: error.message
        }
      }
    }
  },

  resendOTP: async (data) => {
    try {
      const { phoneNumber } = data
      
      // Generate new OTP
      const otp = twilioService.generateOTP()
      
      // Send new OTP via Twilio
      const result = await twilioService.sendOTP(phoneNumber, otp)
      
      if (result.success) {
        console.log('✅ OTP resent successfully to:', phoneNumber)
        console.log('🔑 New OTP for testing:', otp) // Remove this in production
        
        return { 
          data: { 
            success: true, 
            message: 'OTP resent successfully',
            otp: otp // Remove this in production
          } 
        }
      } else {
        console.error('❌ Failed to resend OTP:', result.message)
        return { 
          data: { 
            success: false, 
            message: result.message 
          } 
        }
      }
    } catch (error) {
      console.error('❌ Error in resendOTP:', error)
      return { 
        data: { 
          success: false, 
          message: 'Failed to resend OTP',
          error: error.message
        } 
      }
    }
  }
}

// Doctors API
export const doctorsAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      // Return in the format expected by components
      return {
        data: {
          success: true,
          doctors: data || []
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      return {
        data: {
          success: false,
          doctors: []
        }
      }
    }
  }
}

// Appointments API
export const appointmentsAPI = {
  book: async (data) => {
    try {
      console.log('📝 Booking appointment with data:', data)
      
      const { 
        doctorId, 
        appointmentDate, 
        timeSlot, 
        patientName,
        patientPhone,
        patientAge,
        patientGender
      } = data

      // First, create or update patient record
      let patientId
      
      // Check if patient already exists
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('phone_number', patientPhone)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing patient:', checkError)
        throw checkError
      }
      
      if (existingPatient) {
        // Update existing patient
        console.log('🔄 Updating existing patient:', existingPatient.id)
        const { error: updateError } = await supabase
          .from('patients')
          .update({
            name: patientName,
            age: patientAge,
            gender: patientGender,
            is_verified: true,
            updated_at: new Date()
          })
          .eq('id', existingPatient.id)
        
        if (updateError) throw updateError
        patientId = existingPatient.id
      } else {
        // Create new patient
        console.log('🆕 Creating new patient')
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert([{
            name: patientName,
            phone_number: patientPhone,
            age: patientAge,
            gender: patientGender,
            is_verified: true
          }])
          .select()
          .single()
        
        if (createError) throw createError
        patientId = newPatient.id
        console.log('✅ New patient created:', patientId)
      }

      // Get next queue number for the doctor on that date
      const { data: lastAppointment } = await supabase
        .from('appointments')
        .select('queue_number')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', appointmentDate)
        .order('queue_number', { ascending: false })
        .limit(1)

      const nextQueueNumber = (lastAppointment?.[0]?.queue_number || 0) + 1
      const estimatedWaitTime = nextQueueNumber * 15 // 15 minutes per patient

      console.log('📅 Creating appointment with queue number:', nextQueueNumber)

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: appointmentDate,
          time_slot: timeSlot,
          status: 'waiting',
          queue_number: nextQueueNumber,
          estimated_wait_time: estimatedWaitTime
        }])
        .select()
        .single()

      if (appointmentError) throw appointmentError

      console.log('✅ Appointment created successfully:', appointment)

      return {
        data: {
          success: true,
          message: 'Appointment booked successfully',
          appointment,
          patientId
        }
      }
    } catch (error) {
      console.error('❌ Error booking appointment:', error)
      return {
        data: {
          success: false,
          message: 'Failed to book appointment',
          error: error.message
        }
      }
    }
  },

  getMyAppointments: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(name, specialization, room),
          patient:patients(name, age, gender)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })

      if (error) throw error

      return {
        data: {
          success: true,
          appointments: data || []
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      return {
        data: {
          success: false,
          appointments: []
        }
      }
    }
  },

  getCurrentStatus: async (patientId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(name, specialization, room),
          patient:patients(name, age, gender)
        `)
        .eq('patient_id', patientId)
        .eq('appointment_date', today)
        .neq('status', 'cancelled')
        .order('queue_number')
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        return {
          data: {
            success: true,
            hasAppointment: true,
            appointment: data[0]
          }
        }
      }

      return {
        data: {
          success: true,
          hasAppointment: false,
          message: 'No appointment found for today'
        }
      }
    } catch (error) {
      console.error('Error fetching current status:', error)
      return {
        data: {
          success: false,
          hasAppointment: false
        }
      }
    }
  },

  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error

      return {
        data: {
          success: true,
          message: 'Appointment status updated successfully',
          appointment: data
        }
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      return {
        data: {
          success: false,
          message: 'Failed to update appointment status',
          error: error.message
        }
      }
    }
  }
}

// Time slots API
export const slotsAPI = {
  getAvailable: async (params) => {
    try {
      const { doctorId, date } = params
      
      console.log('🎯 Generating time slots for:', { doctorId, date })
      
      // Generate all time slots (9:00 AM to 1:00 PM, 10-minute intervals)
      // Total slots: 4 hours × 6 slots per hour = 24 slots
      // Times: 9:00, 9:10, 9:20, 9:30, 9:40, 9:50, 10:00, 10:10, 10:20, 10:30, 10:40, 10:50, 11:00, 11:10, 11:20, 11:30, 11:40, 11:50, 12:00, 12:10, 12:20, 12:30, 12:40, 12:50, 1:00
      const availableSlots = []
      const startHour = 9
      const endHour = 13 // Changed from 12 to 13 to include 1:00 PM

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // Format display time properly (9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM)
          let displayHour = hour
          let ampm = 'AM'
          
          if (hour === 12) {
            displayHour = 12
            ampm = 'PM'
          } else if (hour > 12) {
            displayHour = hour - 12
            ampm = 'PM'
          }
          
          const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
          
          // Check if slot is in the past for today
          const isPastSlot = date === new Date().toISOString().split('T')[0] && 
                           new Date().getHours() > hour || 
                           (new Date().getHours() === hour && new Date().getMinutes() > minute)

          availableSlots.push({
            time: timeSlot,
            displayTime,
            available: !isPastSlot // All slots are available unless they're in the past
          })
        }
      }

      console.log('✅ Generated', availableSlots.length, 'time slots')
      console.log('📅 Sample slots:', availableSlots.slice(0, 3))

      return {
        data: {
          success: true,
          availableSlots: availableSlots
        }
      }
    } catch (error) {
      console.error('❌ Error getting available slots:', error)
      return {
        data: {
          success: false,
          availableSlots: []
        }
      }
    }
  }
}

// Initialize database with sample data if needed
export const initializeDatabase = async () => {
  try {
    console.log('🔍 Checking if database needs initialization...')
    
    // Check if doctors table has data
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('count')
      .limit(1)
    
    if (doctorsError) {
      console.error('❌ Cannot access doctors table:', doctorsError)
      return false
    }
    
    // Check if we need to add sample doctors
    const { data: existingDoctors } = await supabase
      .from('doctors')
      .select('*')
      .limit(5)
    
    if (!existingDoctors || existingDoctors.length === 0) {
      console.log('📝 Adding sample doctors to database...')
      
      const sampleDoctors = [
        {
          name: 'Dr. Sarah Johnson',
          specialization: 'Cardiologist',
          phone_number: '1234567890',
          email: 'dr.sarah@hospital.com',
          room: '101',
          is_active: true
        },
        {
          name: 'Dr. Robert Williams',
          specialization: 'Neurologist',
          phone_number: '1234567891',
          email: 'dr.robert@hospital.com',
          room: '205',
          is_active: true
        },
        {
          name: 'Dr. Emily Davis',
          specialization: 'Pediatrician',
          phone_number: '1234567892',
          email: 'dr.emily@hospital.com',
          room: '103',
          is_active: true
        }
      ]
      
      const { error: insertError } = await supabase
        .from('doctors')
        .insert(sampleDoctors)
      
      if (insertError) {
        console.error('❌ Failed to insert sample doctors:', insertError)
        return false
      }
      
      console.log('✅ Sample doctors added successfully!')
    } else {
      console.log('✅ Database already has doctors data')
    }
    
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return false
  }
}

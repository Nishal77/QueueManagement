-- Simple table creation script
-- Run this in your Supabase SQL Editor

-- 1. Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  room VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(20) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add foreign key constraints
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_doctor 
FOREIGN KEY (doctor_id) REFERENCES doctors(id);

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id);

-- 5. Insert sample doctors only (no patients/appointments)
INSERT INTO doctors (name, specialization, phone_number, room) VALUES
('Dr. Rajesh Kumar', 'Cardiologist', '+91-98765-43210', '101'),
('Dr. Priya Sharma', 'Neurologist', '+91-98765-43211', '205'),
('Dr. Amit Patel', 'Pediatrician', '+91-98765-43212', '103')
ON CONFLICT DO NOTHING;

-- 6. Verify tables and doctors were created
SELECT 'Doctors:' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'Patients:', COUNT(*) FROM patients
UNION ALL
SELECT 'Appointments:', COUNT(*) FROM appointments;

-- 7. Show available doctors
SELECT 
  id,
  name,
  specialization,
  room,
  is_active
FROM doctors
ORDER BY name;

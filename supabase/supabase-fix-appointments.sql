-- Fix appointments table structure and data relationships
-- Run this in your Supabase SQL Editor step by step

-- 1. First, let's check what we have
SELECT 'Current table structure:' as info;
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('appointments', 'patients', 'doctors')
ORDER BY table_name, ordinal_position;

-- 2. Check current data counts
SELECT 'Current data counts:' as info;
SELECT 
  'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM patients  
UNION ALL
SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors;

-- 3. Check if appointments have proper foreign keys
SELECT 'Appointments with patient/doctor data:' as info;
SELECT 
  a.id,
  a.doctor_id,
  a.patient_id,
  a.appointment_date,
  a.time_slot,
  a.status,
  a.queue_number,
  CASE 
    WHEN p.name IS NOT NULL THEN p.name 
    ELSE 'NO PATIENT DATA' 
  END as patient_name,
  CASE 
    WHEN p.gender IS NOT NULL THEN p.gender 
    ELSE 'NO GENDER DATA' 
  END as patient_gender,
  CASE 
    WHEN p.phone_number IS NOT NULL THEN p.phone_number 
    ELSE 'NO PHONE DATA' 
  END as patient_phone,
  CASE 
    WHEN d.name IS NOT NULL THEN d.name 
    ELSE 'NO DOCTOR DATA' 
  END as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LIMIT 10;

-- 4. Drop and recreate tables with proper structure
-- WARNING: This will delete all existing data!

-- Drop existing tables in correct order
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  room VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(20) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed')),
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_queue ON appointments(queue_number);

-- Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for development
CREATE POLICY "Allow all operations on doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- 5. Insert sample data
INSERT INTO doctors (name, specialization, room) VALUES
('Dr. Sarah Johnson', 'Cardiologist', '101'),
('Dr. Robert Williams', 'Neurologist', '205'),
('Dr. Emily Davis', 'Pediatrician', '103');

INSERT INTO patients (name, phone_number, age, gender, is_verified) VALUES
('John Doe', '+1234567890', 30, 'Male', true),
('Jane Smith', '+1234567891', 25, 'Female', true),
('Mike Johnson', '+1234567892', 45, 'Male', true),
('Sarah Wilson', '+1234567893', 35, 'Female', true);

INSERT INTO appointments (doctor_id, patient_id, appointment_date, time_slot, status, queue_number, estimated_wait_time) VALUES
((SELECT id FROM doctors WHERE name = 'Dr. Sarah Johnson'), (SELECT id FROM patients WHERE name = 'John Doe'), CURRENT_DATE, '09:00', 'waiting', 1, 15),
((SELECT id FROM doctors WHERE name = 'Dr. Sarah Johnson'), (SELECT id FROM patients WHERE name = 'Jane Smith'), CURRENT_DATE, '09:10', 'waiting', 2, 20),
((SELECT id FROM doctors WHERE name = 'Dr. Robert Williams'), (SELECT id FROM patients WHERE name = 'Mike Johnson'), CURRENT_DATE, '09:00', 'waiting', 1, 10),
((SELECT id FROM doctors WHERE name = 'Dr. Emily Davis'), (SELECT id FROM patients WHERE name = 'Sarah Wilson'), CURRENT_DATE, '09:00', 'waiting', 1, 12);

-- 6. Verify the data was created correctly
SELECT 'Verification - Sample appointments with full data:' as info;
SELECT 
  a.id,
  a.queue_number as token_no,
  p.name as patient_name,
  p.phone_number as patient_phone,
  a.time_slot as appointment_time,
  p.gender as patient_gender,
  a.status,
  d.name as doctor_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.doctor_id, a.queue_number;

-- 7. Test the exact query that the frontend uses
SELECT 'Frontend query test:' as info;
SELECT 
  a.*,
  p.name as patient_name,
  p.gender as patient_gender,
  p.phone_number as patient_phone,
  d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.doctor_id = (SELECT id FROM doctors LIMIT 1)
ORDER BY a.queue_number;

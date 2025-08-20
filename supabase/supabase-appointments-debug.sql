-- Debug appointments table structure and data
-- Run this in your Supabase SQL Editor

-- 1. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- 2. Check if appointments table has data
SELECT COUNT(*) as total_appointments FROM appointments;

-- 3. Check sample appointments with patient and doctor info
SELECT 
  a.id,
  a.doctor_id,
  a.patient_id,
  a.appointment_date,
  a.time_slot,
  a.status,
  a.queue_number,
  p.name as patient_name,
  p.gender as patient_gender,
  p.phone_number as patient_phone,
  d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LIMIT 10;

-- 4. Check patients table
SELECT COUNT(*) as total_patients FROM patients;
SELECT id, name, gender, phone_number, age FROM patients LIMIT 5;

-- 5. Check doctors table
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT id, name, specialization, room FROM doctors LIMIT 5;

-- 6. Check foreign key relationships
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='appointments';

-- 7. If no data exists, create sample data
-- First, create a sample doctor if none exists
INSERT INTO doctors (name, specialization, room, is_active)
SELECT 'Dr. Sarah Johnson', 'Cardiologist', '101', true
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);

-- Create a sample patient if none exists
INSERT INTO patients (name, phone_number, age, gender, is_verified)
SELECT 'John Doe', '+1234567890', 30, 'Male', true
WHERE NOT EXISTS (SELECT 1 FROM patients LIMIT 1);

-- Create a sample appointment if none exists
INSERT INTO appointments (doctor_id, patient_id, appointment_date, time_slot, status, queue_number, estimated_wait_time)
SELECT 
  (SELECT id FROM doctors LIMIT 1),
  (SELECT id FROM patients LIMIT 1),
  CURRENT_DATE,
  '09:00',
  'waiting',
  1,
  15
WHERE NOT EXISTS (SELECT 1 FROM appointments LIMIT 1);

-- 8. Verify the sample data was created
SELECT 
  a.id,
  a.doctor_id,
  a.patient_id,
  a.appointment_date,
  a.time_slot,
  a.status,
  a.queue_number,
  p.name as patient_name,
  p.gender as patient_gender,
  p.phone_number as patient_phone,
  d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LIMIT 10;

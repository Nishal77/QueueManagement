-- Perfect Supabase Setup Script
-- Run this in your Supabase SQL Editor to create everything perfectly

-- 1. Drop existing tables if they exist (clean start)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- 2. Create doctors table with perfect structure
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  room VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create patients table with perfect structure
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

-- 4. Create appointments table with perfect structure
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed')),
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add foreign key constraints
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_doctor 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- 6. Create indexes for better performance
CREATE INDEX idx_doctors_active ON doctors(is_active);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_verified ON patients(is_verified);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_queue ON appointments(queue_number);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 8. Create permissive RLS policies for development
CREATE POLICY "Allow all operations on doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- 9. Insert perfect sample doctors
INSERT INTO doctors (name, specialization, phone_number, room, is_active) VALUES
('Dr. Rajesh Kumar', 'Cardiologist', '+91-98765-43210', '101', true),
('Dr. Priya Sharma', 'Neurologist', '+91-98765-43211', '205', true),
('Dr. Amit Patel', 'Pediatrician', '+91-98765-43212', '103', true);

-- 10. Verify everything was created perfectly
SELECT '=== DATABASE SETUP COMPLETE ===' as status;

SELECT 'Doctors Table:' as table_info;
SELECT 
  id,
  name,
  specialization,
  phone_number,
  room,
  is_active,
  created_at
FROM doctors
ORDER BY name;

SELECT 'Table Counts:' as counts;
SELECT 
  'doctors' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments;

SELECT 'Database Structure:' as structure;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('doctors', 'patients', 'appointments')
ORDER BY table_name, ordinal_position;

-- 11. Test a sample query (should work perfectly)
SELECT 'Sample Query Test:' as test;
SELECT 
  d.name as doctor_name,
  d.specialization,
  d.room,
  d.phone_number
FROM doctors d
WHERE d.is_active = true
ORDER BY d.name;

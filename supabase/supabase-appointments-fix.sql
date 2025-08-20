-- Fix appointments table schema for slots API
-- Run this in your Supabase SQL Editor

-- 1. Check current appointments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- 2. Check if appointments table exists and has data
SELECT COUNT(*) as appointment_count FROM appointments;

-- 3. Check appointments table constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass;

-- 4. If appointments table is missing or has wrong structure, recreate it
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL, -- Format: "09:00", "09:10", etc.
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time_slot ON appointments(time_slot);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies (very permissive for development)
CREATE POLICY "Allow all operations on appointments" ON appointments
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert sample appointment data for testing
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, queue_number, estimated_wait_time) VALUES
  (
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM doctors LIMIT 1),
    CURRENT_DATE,
    '09:00',
    'scheduled',
    1,
    0
  ),
  (
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM doctors LIMIT 1),
    CURRENT_DATE,
    '09:30',
    'scheduled',
    2,
    15
  );

-- 10. Verify the fix
SELECT 
  'appointments' as table_name, 
  count(*) as row_count 
FROM appointments;

-- 11. Test the slots query
SELECT 
  a.time_slot,
  a.status,
  d.name as doctor_name,
  p.name as patient_name
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
JOIN patients p ON a.patient_id = p.id
WHERE a.appointment_date = CURRENT_DATE
  AND a.status != 'cancelled'
ORDER BY a.time_slot;

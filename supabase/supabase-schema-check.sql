-- Check current database schema and fix any issues
-- Run this in your Supabase SQL Editor

-- 1. Check current tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check patients table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- 3. Check constraints on patients table
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients';

-- 4. Check if there are any data issues
SELECT COUNT(*) as total_patients FROM patients;
SELECT COUNT(*) as patients_with_null_name FROM patients WHERE name IS NULL;
SELECT COUNT(*) as patients_with_null_phone FROM patients WHERE phone_number IS NULL;

-- 5. Fix any schema issues (run these if needed)

-- Drop and recreate patients table with proper constraints
DROP TABLE IF EXISTS patients CASCADE;

CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  phone_number VARCHAR(10) NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 1 AND age <= 120),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_name ON patients(name);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policy for development
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Verify the fix
SELECT 'patients' as table_name, count(*) as row_count FROM patients;

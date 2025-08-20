-- Verify Data Relationships in Supabase
-- Run this in your Supabase SQL Editor to check why patient data isn't showing

-- 1. Check all tables and their counts
SELECT '=== TABLE COUNTS ===' as info;

SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments;

-- 2. Check if appointments have proper foreign keys
SELECT '=== APPOINTMENT RELATIONSHIPS ===' as info;

SELECT 
  a.id as appointment_id,
  a.doctor_id,
  a.patient_id,
  a.appointment_date,
  a.time_slot,
  a.status,
  a.queue_number,
  CASE 
    WHEN d.name IS NOT NULL THEN d.name 
    ELSE '❌ DOCTOR NOT FOUND' 
  END as doctor_name,
  CASE 
    WHEN p.name IS NOT NULL THEN p.name 
    ELSE '❌ PATIENT NOT FOUND' 
  END as patient_name,
  CASE 
    WHEN p.gender IS NOT NULL THEN p.gender 
    ELSE '❌ NO GENDER' 
  END as patient_gender,
  CASE 
    WHEN p.phone_number IS NOT NULL THEN p.phone_number 
    ELSE '❌ NO PHONE' 
  END as patient_phone
FROM appointments a
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN patients p ON a.patient_id = p.id
ORDER BY a.queue_number;

-- 3. Test the exact query the frontend uses
SELECT '=== FRONTEND QUERY TEST ===' as info;

-- Get first doctor ID
WITH first_doctor AS (
  SELECT id FROM doctors LIMIT 1
)
SELECT 
  a.id,
  a.queue_number,
  a.time_slot,
  a.status,
  a.appointment_date,
  a.estimated_wait_time,
  p.name as patient_name,
  p.gender as patient_gender,
  p.phone_number as patient_phone,
  d.name as doctor_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN first_doctor fd ON a.doctor_id = fd.id
ORDER BY a.queue_number;

-- 4. Check for any orphaned appointments
SELECT '=== ORPHANED APPOINTMENTS ===' as info;

SELECT 
  'Appointments without doctors' as issue,
  COUNT(*) as count
FROM appointments a
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT 
  'Appointments without patients' as issue,
  COUNT(*) as count
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE p.id IS NULL;

-- 5. Show sample data for each table
SELECT '=== SAMPLE DOCTORS ===' as info;
SELECT id, name, specialization, phone_number, room FROM doctors LIMIT 3;

SELECT '=== SAMPLE PATIENTS ===' as info;
SELECT id, name, phone_number, age, gender FROM patients LIMIT 3;

SELECT '=== SAMPLE APPOINTMENTS ===' as info;
SELECT id, doctor_id, patient_id, appointment_date, time_slot, status, queue_number FROM appointments LIMIT 3;

-- 6. Test foreign key constraints
SELECT '=== FOREIGN KEY TEST ===' as info;

-- This should work if foreign keys are properly set up
SELECT 
  a.id,
  a.queue_number,
  a.time_slot,
  a.status,
  p.name as patient_name,
  p.gender as patient_gender,
  p.phone_number as patient_phone,
  d.name as doctor_name
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
INNER JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.queue_number;

-- Clean up test data from database
-- Run this in your Supabase SQL Editor

-- 1. Delete test appointments first (due to foreign key constraints)
DELETE FROM appointments 
WHERE patient_id IN (
  SELECT id FROM patients 
  WHERE name LIKE '%Test%' 
     OR name LIKE '%Dummy%' 
     OR name LIKE '%Sample%'
     OR phone_number = '+91-99999-99999'
);

-- 2. Delete test patients
DELETE FROM patients 
WHERE name LIKE '%Test%' 
   OR name LIKE '%Dummy%' 
   OR name LIKE '%Sample%'
   OR phone_number = '+91-99999-99999';

-- 3. Verify cleanup
SELECT '=== AFTER CLEANUP ===' as status;

SELECT 'Patients:' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'Appointments:', COUNT(*) FROM appointments;

-- 4. Show remaining data
SELECT '=== REMAINING PATIENTS ===' as info;
SELECT id, name, phone_number, age, gender FROM patients ORDER BY created_at DESC;

SELECT '=== REMAINING APPOINTMENTS ===' as info;
SELECT 
  a.id,
  a.queue_number,
  a.time_slot,
  a.status,
  a.appointment_date,
  p.name as patient_name,
  d.name as doctor_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.created_at DESC;

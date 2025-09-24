
DROP TABLE IF EXISTS live_tracker CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  room VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  working_hours_start VARCHAR(5) DEFAULT '09:00',
  working_hours_end VARCHAR(5) DEFAULT '13:00',
  consultation_fee DECIMAL(10,2) DEFAULT 0.00,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  is_verified BOOLEAN DEFAULT false,
  email VARCHAR(255),
  emergency_contact VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'cancelled', 'no-show')),
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER DEFAULT 0,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  consultation_notes TEXT,
  prescription TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique appointment per doctor per time slot
  UNIQUE(doctor_id, appointment_date, time_slot)
);


CREATE TABLE live_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  queue_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'cancelled', 'no-show')),
  estimated_wait_time INTEGER DEFAULT 0,
  actual_wait_time INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);


CREATE TABLE time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time VARCHAR(10) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique slot per doctor per date and time
  UNIQUE(doctor_id, slot_date, slot_time)
);

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'appointment_reminder', 'queue_update', 'status_change'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Doctors 
CREATE INDEX idx_doctors_active ON doctors(is_active);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_phone ON doctors(phone_number);

-- Patients 
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_verified ON patients(is_verified);
CREATE INDEX idx_patients_name ON patients(name);

-- Appointments 
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_queue ON appointments(queue_number);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Live tracker 
CREATE INDEX idx_live_tracker_doctor_status ON live_tracker(doctor_id, status);
CREATE INDEX idx_live_tracker_appointment ON live_tracker(appointment_id);
CREATE INDEX idx_live_tracker_active ON live_tracker(is_active);

-- OTP 
CREATE INDEX idx_otp_phone ON otp_verifications(phone_number);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Time slots 
CREATE INDEX idx_time_slots_doctor_date ON time_slots(doctor_id, slot_date);
CREATE INDEX idx_time_slots_available ON time_slots(is_available);
CREATE INDEX idx_time_slots_booked ON time_slots(is_booked);

-- Notifications 
CREATE INDEX idx_notifications_patient ON notifications(patient_id);
CREATE INDEX idx_notifications_doctor ON notifications(doctor_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);


-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (replace with proper auth in production)
CREATE POLICY "Allow all operations on doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on live_tracker" ON live_tracker FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on otp_verifications" ON otp_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on time_slots" ON time_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create live tracker entry
CREATE OR REPLACE FUNCTION create_live_tracker_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO live_tracker (
        appointment_id,
        doctor_id,
        patient_id,
        queue_number,
        status,
        estimated_wait_time,
        start_time
    ) VALUES (
        NEW.id,
        NEW.doctor_id,
        NEW.patient_id,
        NEW.queue_number,
        NEW.status,
        NEW.estimated_wait_time,
        NOW()
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create live tracker entry when appointment is created
CREATE TRIGGER create_live_tracker_trigger
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_live_tracker_entry();

-- Function to update live tracker when appointment status changes
CREATE OR REPLACE FUNCTION update_live_tracker_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE live_tracker 
    SET 
        status = NEW.status,
        last_updated = NOW(),
        end_time = CASE 
            WHEN NEW.status = 'completed' OR NEW.status = 'cancelled' THEN NOW()
            ELSE end_time
        END
    WHERE appointment_id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update live tracker when appointment status changes
CREATE TRIGGER update_live_tracker_status_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_live_tracker_status();

-- Function to generate next queue number
CREATE OR REPLACE FUNCTION get_next_queue_number(doctor_uuid UUID, appointment_date DATE)
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_number
    FROM appointments
    WHERE doctor_id = doctor_uuid 
    AND appointment_date = get_next_queue_number.appointment_date;
    
    RETURN next_number;
END;
$$ language 'plpgsql';


-- Insert sample doctors
INSERT INTO doctors (name, specialization, phone_number, email, room, is_active, working_hours_start, working_hours_end, consultation_fee, bio) VALUES
('Dr. Sarah Johnson', 'Cardiologist', '+91-98765-43210', 'dr.sarah@hospital.com', '101', true, '09:00', '13:00', 500.00, 'Experienced cardiologist with 15+ years of practice'),
('Dr. Robert Williams', 'Neurologist', '+91-98765-43211', 'dr.robert@hospital.com', '205', true, '09:00', '13:00', 600.00, 'Specialized in neurological disorders and brain surgery'),
('Dr. Emily Davis', 'Pediatrician', '+91-98765-43212', 'dr.emily@hospital.com', '103', true, '09:00', '13:00', 400.00, 'Caring pediatrician with expertise in child health'),
('Dr. Michael Brown', 'Orthopedic Surgeon', '+91-98765-43213', 'dr.michael@hospital.com', '301', true, '09:00', '13:00', 800.00, 'Expert in bone and joint surgeries'),
('Dr. Lisa Wilson', 'Dermatologist', '+91-98765-43214', 'dr.lisa@hospital.com', '107', true, '09:00', '13:00', 450.00, 'Skin specialist with advanced cosmetic procedures');

-- Insert sample patients
INSERT INTO patients (name, phone_number, age, gender, is_verified, email, emergency_contact) VALUES
('John Doe', '9876543210', 35, 'male', true, 'john.doe@email.com', '9876543211'),
('Jane Smith', '9876543212', 28, 'female', true, 'jane.smith@email.com', '9876543213'),
('Mike Johnson', '9876543214', 45, 'male', true, 'mike.johnson@email.com', '9876543215'),
('Sarah Wilson', '9876543216', 32, 'female', true, 'sarah.wilson@email.com', '9876543217'),
('David Brown', '9876543218', 50, 'male', true, 'david.brown@email.com', '9876543219');

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, queue_number, estimated_wait_time) VALUES
(
  (SELECT id FROM patients WHERE phone_number = '9876543210' LIMIT 1),
  (SELECT id FROM doctors WHERE name = 'Dr. Sarah Johnson' LIMIT 1),
  CURRENT_DATE,
  '09:00',
  'waiting',
  1,
  0
),
(
  (SELECT id FROM patients WHERE phone_number = '9876543212' LIMIT 1),
  (SELECT id FROM doctors WHERE name = 'Dr. Sarah Johnson' LIMIT 1),
  CURRENT_DATE,
  '09:20',
  'waiting',
  2,
  15
),
(
  (SELECT id FROM patients WHERE phone_number = '9876543214' LIMIT 1),
  (SELECT id FROM doctors WHERE name = 'Dr. Robert Williams' LIMIT 1),
  CURRENT_DATE,
  '10:00',
  'in-progress',
  1,
  0
);


-- Verify table creation and data
SELECT '=== DATABASE SETUP COMPLETE ===' as status;

SELECT 'Table Counts:' as counts;
SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'live_tracker' as table_name, COUNT(*) as count FROM live_tracker
UNION ALL
SELECT 'otp_verifications' as table_name, COUNT(*) as count FROM otp_verifications
UNION ALL
SELECT 'time_slots' as table_name, COUNT(*) as count FROM time_slots
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as count FROM notifications;

-- Test appointment with joins
SELECT 'Sample Appointment Data:' as sample_data;
SELECT 
  a.id,
  a.queue_number,
  a.time_slot,
  a.status,
  a.appointment_date,
  p.name as patient_name,
  p.phone_number,
  p.gender,
  d.name as doctor_name,
  d.specialization,
  d.room
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.queue_number
LIMIT 5;

-- Test live tracker data
SELECT 'Live Tracker Data:' as live_data;
SELECT 
  lt.id,
  lt.queue_number,
  lt.status,
  lt.estimated_wait_time,
  p.name as patient_name,
  d.name as doctor_name,
  lt.last_updated
FROM live_tracker lt
JOIN patients p ON lt.patient_id = p.id
JOIN doctors d ON lt.doctor_id = d.id
ORDER BY lt.queue_number;

-- Database structure verification
SELECT 'Database Structure:' as structure;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('doctors', 'patients', 'appointments', 'live_tracker', 'otp_verifications', 'time_slots', 'notifications')
ORDER BY table_name, ordinal_position;

SELECT '=== SETUP COMPLETE - READY FOR APPLICATION ===' as final_status;

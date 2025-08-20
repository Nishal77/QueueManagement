-- Create patients table
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

-- Create doctors table
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  phone_number VARCHAR(10) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  working_hours_start VARCHAR(5) DEFAULT '09:00',
  working_hours_end VARCHAR(5) DEFAULT '13:00',
  room VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(5) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'cancelled')),
  queue_number INTEGER NOT NULL,
  estimated_wait_time INTEGER DEFAULT 0,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_tracker table
CREATE TABLE live_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE UNIQUE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  queue_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'completed', 'cancelled')),
  estimated_wait_time INTEGER DEFAULT 0,
  actual_wait_time INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_date_doctor ON appointments(appointment_date, doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_live_tracker_doctor_status ON live_tracker(doctor_id, status);
CREATE INDEX idx_live_tracker_appointment ON live_tracker(appointment_id);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (auth.uid()::text = id::text);

-- Patients can update their own data
CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can insert patients (for registration)
CREATE POLICY "Anyone can insert patients" ON patients
  FOR INSERT WITH CHECK (true);

-- Doctors are publicly viewable
CREATE POLICY "Doctors are publicly viewable" ON doctors
  FOR SELECT USING (true);

-- Appointments: patients can view their own, doctors can view their patients
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (auth.uid()::text = patient_id::text);

CREATE POLICY "Doctors can view their appointments" ON appointments
  FOR SELECT USING (auth.uid()::text = doctor_id::text);

-- Anyone can insert appointments (for booking)
CREATE POLICY "Anyone can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Live tracker: similar policies
CREATE POLICY "Patients can view own live tracking" ON live_tracker
  FOR SELECT USING (auth.uid()::text = patient_id::text);

CREATE POLICY "Doctors can view their live tracking" ON live_tracker
  FOR SELECT USING (auth.uid()::text = doctor_id::text);

-- Insert some sample doctors
INSERT INTO doctors (name, specialization, phone_number, email, room) VALUES
('Dr. Sarah Johnson', 'Cardiologist', '1234567890', 'dr.sarah@hospital.com', '101'),
('Dr. Robert Williams', 'Neurologist', '1234567891', 'dr.robert@hospital.com', '205'),
('Dr. Emily Davis', 'Pediatrician', '1234567892', 'dr.emily@hospital.com', '103');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

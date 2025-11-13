-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('cliente', 'profesional');
CREATE TYPE appointment_status AS ENUM ('pendiente_pago', 'pagada', 'pendiente_aceptacion', 'aceptada', 'rechazada', 'completada', 'cancelada');
CREATE TYPE notification_type AS ENUM ('pago_realizado', 'cita_aceptada', 'cita_rechazada', 'cita_cancelada', 'recordatorio_cita', 'cita_completada');
CREATE TYPE day_of_week AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professionals table
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    profession TEXT NOT NULL,
    bio TEXT,
    price_per_hour DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create availabilities table
CREATE TABLE availabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pendiente_pago',
    cancellation_reason TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_reference TEXT NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for professionals
CREATE POLICY "Everyone can view active professionals" ON professionals FOR SELECT USING (is_active = true);
CREATE POLICY "Professionals can update own profile" ON professionals FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Professionals can insert own profile" ON professionals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for availabilities
CREATE POLICY "Everyone can view active availabilities" ON availabilities FOR SELECT USING (true);
CREATE POLICY "Professionals can manage own availabilities" ON availabilities FOR ALL TO authenticated USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT TO authenticated USING (
    client_id = auth.uid() OR 
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);
CREATE POLICY "Clients can create appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE TO authenticated USING (
    client_id = auth.uid() OR 
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT TO authenticated USING (
    appointment_id IN (
        SELECT id FROM appointments WHERE client_id = auth.uid() OR 
        professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Clients can create payments" ON payments FOR INSERT TO authenticated WITH CHECK (
    appointment_id IN (SELECT id FROM appointments WHERE client_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their appointments" ON chat_messages FOR SELECT TO authenticated USING (
    appointment_id IN (
        SELECT id FROM appointments WHERE client_id = auth.uid() OR 
        professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Users can send messages for their appointments" ON chat_messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    appointment_id IN (
        SELECT id FROM appointments WHERE client_id = auth.uid() OR 
        professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availabilities_updated_at BEFORE UPDATE ON availabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cliente')
    );
    RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
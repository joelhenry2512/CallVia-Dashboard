-- Callvia Database Schema
-- Complete SQL schema for Supabase/PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Clients table (businesses using Callvia)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, paused, suspended
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    show_rate_target DECIMAL(5,2) DEFAULT 60.00,
    per_minute_rate DECIMAL(6,2) DEFAULT 0.20,
    milestone_amount DECIMAL(10,2) DEFAULT 2000.00,
    milestone_interval INTEGER DEFAULT 25, -- appointments per milestone
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (login credentials)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'client', -- admin, client, agent
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table (lead batches)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    total_leads INTEGER DEFAULT 0,
    leads_called INTEGER DEFAULT 0,
    leads_remaining INTEGER DEFAULT 0,
    appointments_set INTEGER DEFAULT 0,
    appointments_shown INTEGER DEFAULT 0,
    show_rate DECIMAL(5,2) DEFAULT 0.00,
    retell_agent_id VARCHAR(255), -- Retell AI agent ID
    schedule_start_time TIME,
    schedule_end_time TIME,
    schedule_days VARCHAR(50), -- JSON array like ["mon","tue","wed"]
    max_daily_calls INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (contact records)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, booked, callback, dnc, no_answer
    priority INTEGER DEFAULT 0,
    call_attempts INTEGER DEFAULT 0,
    last_call_date TIMESTAMP WITH TIME ZONE,
    appointment_id UUID,
    notes TEXT,
    custom_fields JSONB, -- flexible additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table (bookings + show tracking)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    calcom_booking_id VARCHAR(255) UNIQUE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, shown, no_show, canceled, rescheduled
    show_verified BOOLEAN DEFAULT false,
    show_verified_by VARCHAR(50), -- client, lead, auto, call_duration
    show_verified_at TIMESTAMP WITH TIME ZONE,
    reschedule_count INTEGER DEFAULT 0,
    reminder_24h_sent BOOLEAN DEFAULT false,
    reminder_2h_sent BOOLEAN DEFAULT false,
    reminder_15m_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call logs table (Retell call metadata)
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    retell_call_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) DEFAULT 'outbound', -- outbound, inbound
    status VARCHAR(50), -- connected, no_answer, busy, failed, completed
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    outcome VARCHAR(100), -- appointment_set, callback_requested, not_interested, dnc
    cost DECIMAL(10,4) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (SMS + Email history)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    channel VARCHAR(20) NOT NULL, -- sms, email
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    subject VARCHAR(500), -- for emails
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, failed, opened, clicked
    provider_message_id VARCHAR(255),
    thread_id UUID, -- group related messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (webhook sink)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- retell, calcom, stripe, sendgrid
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table (track shown appointments + billing)
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    milestone_number INTEGER NOT NULL, -- 1, 2, 3...
    appointments_shown INTEGER NOT NULL, -- cumulative count
    invoice_id UUID,
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, invoiced, paid, failed
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table (Stripe invoice data)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    invoice_type VARCHAR(50) NOT NULL, -- milestone, usage, manual
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, void, uncollectible
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    invoice_pdf TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table (for per-minute billing)
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    call_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
    minutes DECIMAL(10,2) NOT NULL,
    rate DECIMAL(6,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billed BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_stripe_customer ON clients(stripe_customer_id);

CREATE INDEX idx_users_client ON users(client_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);

CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_calcom ON appointments(calcom_booking_id);

CREATE INDEX idx_call_logs_client ON call_logs(client_id);
CREATE INDEX idx_call_logs_lead ON call_logs(lead_id);
CREATE INDEX idx_call_logs_retell ON call_logs(retell_call_id);
CREATE INDEX idx_call_logs_started ON call_logs(started_at);

CREATE INDEX idx_messages_client ON messages(client_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_created ON messages(created_at);

CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_processed ON events(processed);
CREATE INDEX idx_events_created ON events(created_at);

CREATE INDEX idx_milestones_client ON milestones(client_id);
CREATE INDEX idx_milestones_status ON milestones(status);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_usage_client ON usage_records(client_id);
CREATE INDEX idx_usage_billed ON usage_records(billed);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign statistics when leads change
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE campaigns
        SET 
            total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id),
            leads_called = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id AND status != 'new'),
            leads_remaining = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id AND status IN ('new', 'callback')),
            appointments_set = (SELECT COUNT(*) FROM appointments WHERE campaign_id = NEW.campaign_id),
            appointments_shown = (SELECT COUNT(*) FROM appointments WHERE campaign_id = NEW.campaign_id AND show_verified = true),
            show_rate = CASE 
                WHEN (SELECT COUNT(*) FROM appointments WHERE campaign_id = NEW.campaign_id) > 0
                THEN (SELECT COUNT(*) FROM appointments WHERE campaign_id = NEW.campaign_id AND show_verified = true) * 100.0 / (SELECT COUNT(*) FROM appointments WHERE campaign_id = NEW.campaign_id)
                ELSE 0
            END
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Policies (basic examples - customize based on your auth setup)
CREATE POLICY "Users can view their own client data" ON clients
    FOR SELECT USING (id IN (SELECT client_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (client_id IN (SELECT client_id FROM users WHERE id = auth.uid()));

-- Add similar policies for other tables as needed

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Insert a test client
-- INSERT INTO clients (name, email, company_name) 
-- VALUES ('John Doe', 'john@example.com', 'Acme Insurance');

// Retell AI Types
export interface RetellCallEvent {
  event_type: 'call.started' | 'call.ended' | 'call.analyzed';
  call_id: string;
  agent_id?: string;
  phone_number?: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  outcome?: string;
  recording_url?: string;
  metadata?: Record<string, any>;
}

// Cal.com Types
export interface CalcomWebhookEvent {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED';
  payload: {
    id: number;
    uid: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    organizer: {
      email: string;
      name: string;
      timeZone: string;
    };
    metadata?: Record<string, any>;
  };
}

// Stripe Types
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Lead Import Types
export interface LeadImportData {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  custom_fields?: Record<string, any>;
}

export interface LeadImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

// Appointment Verification Types
export interface AppointmentVerification {
  appointment_id: string;
  status: 'shown' | 'no-show';
  verified_by: 'client' | 'lead' | 'system' | 'admin';
  notes?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_calls: number;
  total_minutes: number;
  appointments_set: number;
  appointments_shown: number;
  show_rate: number;
  total_spend: number;
  next_milestone_progress: number;
}

// Campaign Stats Types
export interface CampaignStats {
  id: string;
  name: string;
  status: string;
  total_leads: number;
  contacted: number;
  appointments_set: number;
  appointments_shown: number;
  show_rate: number;
  created_at: string;
}

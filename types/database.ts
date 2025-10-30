export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          company_name: string | null
          phone: string | null
          stripe_customer_id: string | null
          per_minute_rate: number
          milestone_amount: number
          milestone_interval: number
          status: 'active' | 'inactive' | 'suspended'
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          client_id: string
          role: 'admin' | 'user'
          full_name: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          created_at: string
          client_id: string
          name: string
          status: 'active' | 'paused' | 'completed'
          total_leads: number
          contacted: number
          appointments_set: number
          appointments_shown: number
          started_at: string | null
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      leads: {
        Row: {
          id: string
          created_at: string
          campaign_id: string
          client_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string
          status: 'pending' | 'contacted' | 'callback' | 'booked' | 'shown' | 'no-show' | 'dnc'
          custom_fields: Json | null
          last_contact_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          client_id: string
          calcom_booking_id: string | null
          scheduled_at: string
          status: 'scheduled' | 'confirmed' | 'shown' | 'no-show' | 'cancelled'
          client_confirmed: boolean
          lead_confirmed: boolean
          verified_at: string | null
          verified_by: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      call_logs: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          client_id: string
          retell_call_id: string
          duration_seconds: number | null
          status: 'initiated' | 'in-progress' | 'completed' | 'failed'
          transcript: string | null
          summary: string | null
          outcome: string | null
          recording_url: string | null
          started_at: string | null
          ended_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['call_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['call_logs']['Insert']>
      }
      messages: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          client_id: string
          type: 'sms' | 'email'
          direction: 'inbound' | 'outbound'
          content: string
          status: 'sent' | 'delivered' | 'failed' | 'read'
          external_id: string | null
          sent_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      milestones: {
        Row: {
          id: string
          created_at: string
          client_id: string
          milestone_number: number
          appointments_count: number
          amount: number
          status: 'pending' | 'paid' | 'failed'
          invoice_id: string | null
          achieved_at: string
          paid_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['milestones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          client_id: string
          stripe_invoice_id: string
          type: 'usage' | 'milestone'
          amount: number
          status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
          billing_period_start: string | null
          billing_period_end: string | null
          due_date: string | null
          paid_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      usage_records: {
        Row: {
          id: string
          created_at: string
          client_id: string
          call_id: string
          minutes: number
          amount: number
          billing_period: string
          billed: boolean
          invoice_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['usage_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['usage_records']['Insert']>
      }
      events: {
        Row: {
          id: string
          created_at: string
          source: string
          event_type: string
          payload: Json
          processed: boolean
          processed_at: string | null
          error: string | null
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
    }
  }
}

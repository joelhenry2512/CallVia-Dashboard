# Callvia System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (Next.js Frontend)                         │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Campaigns  │  Leads  │  Appointments  │  Billing │
│  (✅ Built) │  (✅ Built) │  (TODO) │    (TODO)     │  (TODO)  │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │ HTTP/HTTPS
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│                   (Next.js API Routes)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Webhooks:                    Core APIs:                       │
│  ├─ /api/webhooks/retell      ├─ /api/leads/import           │
│  ├─ /api/webhooks/calcom      ├─ /api/appointments/verify    │
│  └─ /api/webhooks/stripe      └─ /api/messages/send          │
│                                                                 │
│  All ✅ Complete                                               │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │
    ┌──┴───────────────────────────────────────┐
    │                                           │
    │                                           │
┌───▼────────────┐                    ┌────────▼──────────┐
│   SUPABASE     │                    │   INTEGRATIONS    │
│  (Database)    │                    │   (External APIs) │
├────────────────┤                    ├───────────────────┤
│                │                    │                   │
│ Tables (15):   │                    │ ├─ Retell AI     │
│ • clients      │◄───────────────────┤ │  (Voice Calls) │
│ • users        │                    │ │                 │
│ • campaigns    │                    │ ├─ Cal.com       │
│ • leads        │                    │ │  (Scheduling)  │
│ • appointments │                    │ │                 │
│ • call_logs    │                    │ ├─ Stripe        │
│ • messages     │                    │ │  (Billing)     │
│ • milestones   │                    │ │                 │
│ • invoices     │                    │ ├─ SendGrid      │
│ • usage_records│                    │ │  (Email)       │
│ • events       │                    │ │                 │
│                │                    │ └─ MessageBird   │
│ ✅ Complete    │                    │    (SMS)         │
└────────────────┘                    └───────────────────┘
```

## 🔄 Data Flow Diagrams

### 1. Campaign Creation & Lead Import

```
User
  │
  │ 1. Creates campaign
  │ 2. Uploads CSV
  │
  ▼
Frontend (campaigns/page.tsx)
  │
  │ POST /api/leads/import
  │
  ▼
API Route (leads/import/route.ts)
  │
  │ • Validates CSV
  │ • Normalizes phone numbers
  │ • Batch insert
  │
  ▼
Supabase
  │
  │ • Insert leads
  │ • Update campaign stats
  │ • Trigger = update_campaign_stats()
  │
  ▼
Campaign Ready ✓
```

### 2. AI Call Flow

```
Retell AI
  │
  │ 1. Initiates outbound call
  │ 2. Lead answers
  │ 3. AI conversation
  │ 4. Call ends
  │
  ▼
Webhooks (3 events)
  │
  ├─► call.started
  │     │
  │     ▼
  │   Create call_log
  │   Update lead.status = 'contacted'
  │
  ├─► call.ended
  │     │
  │     ▼
  │   Update call_log (duration, transcript)
  │   Create usage_record
  │   Calculate cost ($0.20/min)
  │
  └─► call.analyzed
        │
        ▼
      Update call_log (summary, outcome)
      │
      ├─► If "appointment_set"
      │     └─► Update lead.status = 'booked'
      │
      ├─► If "callback_requested"
      │     └─► Update lead.status = 'callback'
      │
      └─► If "not_interested"
            └─► Update lead.status = 'dnc'
```

### 3. Appointment Booking Flow

```
Lead Books Appointment
  │
  │ Via Cal.com link
  │
  ▼
Cal.com
  │
  │ webhook: BOOKING_CREATED
  │
  ▼
API Route (/api/webhooks/calcom)
  │
  │ 1. Find lead by email/phone
  │ 2. Create appointment record
  │ 3. Update lead.status = 'booked'
  │
  ▼
Schedule Reminders
  │
  ├─► 24 hours before
  │     └─► Send SMS + Email
  │           "Reminder: Appointment tomorrow..."
  │
  ├─► 2 hours before
  │     └─► Send SMS
  │           "Appointment in 2 hours..."
  │
  └─► 15 minutes before
        └─► Send SMS
              "Starting in 15 minutes..."
```

### 4. Show Verification & Billing Flow

```
Appointment Time Passes
  │
  │ Wait 48 hours
  │
  ▼
Auto-Verification Cron Job
  │
  │ Check verification hierarchy:
  │
  ├─► Client confirmed "Yes"?
  │     └─► Mark as SHOWN ✓
  │
  ├─► Lead confirmed "Yes"?
  │     └─► Mark as SHOWN ✓
  │
  ├─► Call log duration > 45s?
  │     └─► Mark as SHOWN ✓
  │
  └─► No confirmation
        └─► Mark as NO-SHOW ✗
              │
              └─► Trigger rebook flow
                    │
                    ├─► Send SMS: "Let's reschedule..."
                    ├─► Wait 2 days
                    ├─► Send Email with booking link
                    └─► Final SMS after 4 days
  │
  ▼
If SHOWN:
  │
  ▼
Check Milestone
  │
  │ Count total shown appointments
  │ for this client
  │
  ▼
Is count % 25 == 0?
  │
  YES
  │
  ▼
Create Milestone Record
  │
  │ milestone_number = count / 25
  │ amount = $2,000
  │ status = 'pending'
  │
  ▼
Create Stripe Invoice
  │
  │ • Create invoice
  │ • Add line item ($2,000)
  │ • Finalize & send
  │
  ▼
Stripe
  │
  │ Customer pays
  │
  ▼
Webhook: invoice.paid
  │
  ▼
Update Database
  │
  │ • invoice.status = 'paid'
  │ • milestone.status = 'paid'
  │
  ▼
Milestone Complete ✓
```

## 🗄️ Database Schema Overview

### Core Entities

```
┌──────────────┐
│   CLIENTS    │
│  (Business)  │
└───────┬──────┘
        │
        │ 1:N
        │
   ┌────▼────────────┬──────────────┬───────────────┐
   │                 │              │               │
┌──▼───────┐  ┌─────▼─────┐  ┌─────▼──────┐  ┌────▼────────┐
│  USERS   │  │ CAMPAIGNS │  │ MILESTONES │  │  INVOICES   │
└──────────┘  └─────┬─────┘  └────────────┘  └─────────────┘
                    │
                    │ 1:N
                    │
              ┌─────▼─────┐
              │   LEADS   │
              └─────┬─────┘
                    │
                    │ 1:N
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼──────┐ ┌──▼────────┐
   │  CALLS  │ │APPOINTMENTS│ │ MESSAGES │
   └─────────┘ └────────────┘ └──────────┘
```

### Key Relationships

- **1 Client** → Many Users, Campaigns, Milestones, Invoices
- **1 Campaign** → Many Leads
- **1 Lead** → Many Calls, Messages; One Appointment
- **1 Call** → One Usage Record
- **1 Milestone** → One Invoice

## 🔐 Security Architecture

```
┌─────────────────────────────────────────┐
│         Authentication Layer            │
│        (Supabase Auth)                 │
├─────────────────────────────────────────┤
│  • Email/Password                      │
│  • Session management                  │
│  • JWT tokens                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Authorization Layer (RLS)           │
│   (Row Level Security)                 │
├─────────────────────────────────────────┤
│  Users can only see their own client's: │
│  • Campaigns                           │
│  • Leads                               │
│  • Appointments                        │
│  • Invoices                            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         API Security                    │
├─────────────────────────────────────────┤
│  • Webhook signature verification      │
│  • Environment variable encryption     │
│  • Rate limiting                       │
│  • Input validation (Zod schemas)     │
└─────────────────────────────────────────┘
```

## 🤖 Automation Architecture

### Option 1: n8n Workflows

```
┌─────────────────┐
│  Cal.com Event  │
│  (New Booking)  │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │    n8n     │
    │  Workflow  │
    └─────┬──────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌──────┐    ┌──────┐
│ SMS  │    │Email │
│Queue │    │Queue │
└──────┘    └──────┘
```

### Option 2: Vercel Cron Jobs

```
┌─────────────────────────┐
│   Vercel Cron Jobs      │
├─────────────────────────┤
│                         │
│  Every 15 minutes:      │
│  └─ Send reminders      │
│                         │
│  Every hour:            │
│  └─ Verify shows        │
│                         │
│  First of month:        │
│  └─ Monthly billing     │
│                         │
└─────────────────────────┘
```

## 💰 Billing Architecture

### Dual Billing Model

```
┌─────────────────────────────────────────┐
│         BILLING SYSTEM                  │
├─────────────────────────────────────────┤
│                                         │
│  Model 1: Usage-Based                  │
│  ┌─────────────────────────────────┐   │
│  │ • Track: Call duration (seconds)│   │
│  │ • Rate: $0.20 per minute       │   │
│  │ • Frequency: Monthly invoice   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Model 2: Milestone-Based              │
│  ┌─────────────────────────────────┐   │
│  │ • Trigger: Every 25 shown appts│   │
│  │ • Amount: $2,000 per milestone │   │
│  │ • Frequency: As achieved       │   │
│  └─────────────────────────────────┘   │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │   Stripe     │
      │   Invoices   │
      └──────────────┘
```

## 🌐 Deployment Architecture

### Production Setup

```
┌───────────────────────────────────────────────────────┐
│                  VERCEL EDGE NETWORK                  │
│                  (Global CDN)                         │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────┐
│              VERCEL SERVERLESS                        │
│              (Next.js Application)                    │
├───────────────────────────────────────────────────────┤
│  • Frontend (React components)                       │
│  • API Routes (webhook handlers)                     │
│  • Cron Jobs (scheduled tasks)                       │
└───────┬───────────────────────────────────┬───────────┘
        │                                   │
        ▼                                   ▼
┌────────────────┐                  ┌──────────────────┐
│   SUPABASE     │                  │   EXTERNAL APIs  │
│   (Database)   │                  │                  │
├────────────────┤                  ├──────────────────┤
│ • PostgreSQL   │                  │ • Retell AI      │
│ • Auth         │                  │ • Cal.com        │
│ • Storage      │                  │ • Stripe         │
│ • Realtime     │                  │ • SendGrid       │
└────────────────┘                  └──────────────────┘
```

## 📊 Data Flow Summary

### Read Operations
```
User → Frontend → Supabase → Return Data
```

### Write Operations
```
User → Frontend → API Route → Supabase → Trigger → Update Stats
```

### Webhook Operations
```
External Service → Webhook → Process → Supabase → Trigger Actions
```

## 🎯 System Components Status

| Component | Status | Files |
|-----------|--------|-------|
| Database Schema | ✅ Complete | callvia-schema.sql |
| Webhook Handlers | ✅ Complete | retell, calcom, stripe routes |
| Lead Import | ✅ Complete | leads/import/route.ts |
| Show Verification | ✅ Complete | appointments/verify/route.ts |
| Dashboard UI | ✅ Complete | dashboard/page.tsx |
| Campaign UI | ✅ Complete | campaigns/page.tsx |
| Leads UI | ⏳ TODO | - |
| Appointments UI | ⏳ TODO | - |
| Billing UI | ⏳ TODO | - |
| Admin Console | ⏳ TODO | - |
| Reminder System | ⏳ TODO | - |
| Auto-Verification | ⏳ TODO | - |

## 🔄 Integration Points

### Inbound Webhooks (Receiving)
- Retell AI → `/api/webhooks/retell`
- Cal.com → `/api/webhooks/calcom`
- Stripe → `/api/webhooks/stripe`
- SendGrid → `/api/webhooks/sendgrid` (optional)

### Outbound API Calls (Sending)
- Retell AI: Initiate calls
- Cal.com: Fetch availability
- Stripe: Create invoices
- SendGrid: Send emails
- MessageBird: Send SMS

## 🎨 UI Component Hierarchy

```
App Layout
│
├─ Navigation
│  ├─ Logo
│  ├─ Menu Items
│  └─ User Menu
│
└─ Page Content
   │
   ├─ Dashboard Page
   │  ├─ KPI Cards (6)
   │  └─ Charts (2)
   │
   ├─ Campaigns Page
   │  ├─ Campaign List
   │  ├─ Campaign Cards
   │  └─ New Campaign Modal
   │
   ├─ Leads Page (TODO)
   │  ├─ Filter Bar
   │  ├─ Search
   │  ├─ Leads Table
   │  └─ Lead Detail Modal
   │
   ├─ Appointments Page (TODO)
   │  ├─ Calendar Embed
   │  ├─ Appointment List
   │  └─ Verification Controls
   │
   └─ Billing Page (TODO)
      ├─ Current Period Stats
      ├─ Invoice List
      └─ Payment Method
```

---

## 📐 Scale Considerations

### Current Design Supports:
- **Clients:** Unlimited
- **Leads per Campaign:** 100,000+
- **Concurrent Webhooks:** 100/sec
- **Database Size:** Multi-GB
- **API Requests:** 1M+/month

### Performance Optimizations:
- Database indexes on all foreign keys
- Batch lead inserts (100 at a time)
- Webhook event queue (events table)
- CDN for static assets
- Connection pooling (Supabase)

---

This architecture is designed to scale from MVP to production-ready SaaS platform.

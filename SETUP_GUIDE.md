# Callvia - Complete Setup Guide for Cursor/Codex

## 🎯 Project Overview

You're building **Callvia**, an AI-powered appointment-setting SaaS for life insurance agents. This guide will help you set up the entire project step-by-step.

## 📦 What's Included

This package contains:

1. **Database Schema** (`callvia-schema.sql`) - Complete PostgreSQL schema with all tables, indexes, and triggers
2. **API Routes** - Webhook handlers for Retell, Cal.com, Stripe
3. **Frontend Components** - Dashboard, campaigns, leads management
4. **Configuration Files** - Package.json, Tailwind, environment variables
5. **Documentation** - README, deployment guide, automation workflows

## 🚀 Quick Start (5 minutes)

### Step 1: Create Project Directory

```bash
mkdir callvia
cd callvia
```

### Step 2: Copy Files

Copy all files from this package into your project:

```
callvia/
├── package.json
├── tailwind.config.js
├── .env.example
├── callvia-schema.sql
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       ├── retell/route.ts
│   │       ├── calcom/route.ts
│   │       └── stripe/route.ts
│   └── dashboard/page.tsx
├── README.md
└── DEPLOYMENT.md
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

### Step 5: Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy project URL and anon key to `.env.local`
4. Go to SQL Editor
5. Copy entire contents of `callvia-schema.sql`
6. Paste and run in SQL Editor
7. Verify 15 tables were created

### Step 6: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📂 File Structure for Cursor/Codex

When setting up in Cursor, organize files like this:

```
callvia/
├── app/                          # Next.js 14 app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard (INCLUDED)
│   ├── campaigns/
│   │   └── page.tsx             # Campaign manager (INCLUDED)
│   ├── leads/
│   │   └── page.tsx             # Leads view (BUILD THIS)
│   ├── appointments/
│   │   └── page.tsx             # Calendar view (BUILD THIS)
│   ├── billing/
│   │   └── page.tsx             # Invoices & usage (BUILD THIS)
│   ├── admin/
│   │   └── page.tsx             # Admin console (BUILD THIS)
│   └── api/
│       ├── webhooks/
│       │   ├── retell/
│       │   │   └── route.ts     # Retell webhook (INCLUDED)
│       │   ├── calcom/
│       │   │   └── route.ts     # Cal.com webhook (INCLUDED)
│       │   ├── stripe/
│       │   │   └── route.ts     # Stripe webhook (INCLUDED)
│       │   └── sendgrid/
│       │       └── route.ts     # SendGrid webhook (BUILD THIS)
│       ├── leads/
│       │   ├── import/
│       │   │   └── route.ts     # CSV import (INCLUDED)
│       │   └── import-sheets/
│       │       └── route.ts     # Google Sheets import (BUILD THIS)
│       ├── appointments/
│       │   └── verify/
│       │       └── route.ts     # Show verification (INCLUDED)
│       ├── messages/
│       │   └── send/
│       │       └── route.ts     # Send SMS/Email (BUILD THIS)
│       └── cron/
│           ├── verify-shows.ts  # Auto-verify (BUILD THIS)
│           └── send-reminders.ts # Reminders (BUILD THIS)
├── components/
│   ├── ui/                      # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx
│   └── charts/
│       ├── LineChart.tsx
│       └── BarChart.tsx
├── lib/
│   ├── supabase.ts             # Supabase client setup
│   ├── stripe.ts               # Stripe client setup
│   ├── retell.ts               # Retell API helpers
│   ├── calcom.ts               # Cal.com API helpers
│   ├── sendgrid.ts             # SendGrid helpers
│   └── utils.ts                # Utility functions
├── types/
│   ├── database.ts             # Supabase types
│   └── api.ts                  # API types
├── public/
│   └── logo.svg
├── styles/
│   └── globals.css
├── package.json                 # Dependencies (INCLUDED)
├── tailwind.config.js           # Tailwind config (INCLUDED)
├── tsconfig.json
├── next.config.js
└── .env.local                   # Environment variables
```

## 🔧 What You Need to Build

### Priority 1: Core Pages

1. **Leads Page** (`app/leads/page.tsx`)
   - Display all leads in a table
   - Filter by status, campaign
   - Search by name/phone
   - View lead details
   - Manual status updates

2. **Appointments Page** (`app/appointments/page.tsx`)
   - Calendar view (embed Cal.com)
   - List of upcoming/past appointments
   - Show verification controls
   - Quick stats

3. **Billing Page** (`app/billing/page.tsx`)
   - Current billing period usage
   - Invoice history
   - Payment methods (Stripe)
   - Next milestone progress

### Priority 2: Admin Console

4. **Admin Dashboard** (`app/admin/page.tsx`)
   - All clients list
   - Global stats
   - Pause/resume campaigns
   - Billing controls

### Priority 3: Additional API Routes

5. **Google Sheets Import** (`app/api/leads/import-sheets/route.ts`)
6. **SMS/Email Sending** (`app/api/messages/send/route.ts`)
7. **Cron Jobs** (verification & reminders)

## 💡 Prompts for Cursor/Codex

Use these prompts to build remaining features:

### For Leads Page:
```
Create a leads management page at app/leads/page.tsx that:
- Fetches leads from Supabase for the current client
- Displays them in a sortable table with columns: name, phone, status, campaign, last call
- Includes filters for status and campaign
- Has a search bar for name/phone
- Shows a modal with full lead details when row is clicked
- Allows updating lead status with a dropdown
Use the same styling as the dashboard page
```

### For Appointments Page:
```
Create an appointments page at app/appointments/page.tsx that:
- Shows a list of upcoming appointments
- Includes filters for date range and status
- Has buttons to verify appointments as "shown" or "no-show"
- Displays appointment details (lead name, time, status)
- Shows show rate percentage at the top
- Has a section to embed Cal.com calendar
Use Recharts for any charts
```

### For Billing Page:
```
Create a billing page at app/billing/page.tsx that:
- Shows current billing period usage (minutes, cost)
- Lists all invoices from Stripe with status
- Shows next milestone progress (X/25 appointments)
- Has a section to manage payment methods
- Displays usage chart by day
Fetch data from Supabase invoices and usage_records tables
```

## 🔌 Integration Setup Checklist

### Retell AI
- [ ] Create account
- [ ] Create AI agent
- [ ] Note agent ID
- [ ] Set webhook URL (after deployment)
- [ ] Add API key to `.env.local`

### Cal.com
- [ ] Create account
- [ ] Create event type
- [ ] Get API key
- [ ] Set webhook URL
- [ ] Add to `.env.local`

### Stripe
- [ ] Create account
- [ ] Get test API keys
- [ ] Set up webhook endpoint
- [ ] Add keys to `.env.local`

### SendGrid
- [ ] Create account
- [ ] Verify sender email
- [ ] Get API key
- [ ] Add to `.env.local`

## 🧪 Testing Your Build

### Test Database Connection
```typescript
// app/test/page.tsx
import { createClient } from '@supabase/supabase-js';

export default async function TestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.from('clients').select('*');
  
  return <pre>{JSON.stringify({ data, error }, null, 2)}</pre>;
}
```

### Test API Routes
```bash
# Test Retell webhook
curl -X POST http://localhost:3000/api/webhooks/retell \
  -H "Content-Type: application/json" \
  -d '{"event_type":"call.started","call_id":"test"}'

# Test lead import
curl -X POST http://localhost:3000/api/leads/import \
  -F "file=@leads.csv" \
  -F "client_id=your-client-id"
```

## 🎨 Design System

Use these color tokens (already in Tailwind config):

- **Primary**: Blue (`primary-500`, `primary-600`)
- **Success**: Green (`success-500`)
- **Warning**: Amber (`warning-500`)
- **Danger**: Red (`danger-500`)

Button styles:
```tsx
// Primary button
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
  Action
</button>

// Secondary button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
</button>
```

## 📊 Sample Data for Testing

Create test client:
```sql
INSERT INTO clients (name, email, company_name)
VALUES ('Test Company', 'test@example.com', 'Test Insurance');
```

Import test leads via CSV:
```csv
first_name,last_name,email,phone
John,Doe,john@example.com,+15551234567
Jane,Smith,jane@example.com,+15559876543
```

## 🚨 Common Issues

### Issue: "Unable to connect to Supabase"
**Solution**: Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Webhook not receiving data"
**Solution**: Use ngrok to expose localhost during development
```bash
ngrok http 3000
# Use ngrok URL as webhook endpoint
```

### Issue: "CORS errors"
**Solution**: Add CORS headers in API routes:
```typescript
return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': '*',
  }
});
```

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Retell AI Docs](https://docs.retell.ai)
- [Cal.com API](https://developer.cal.com)
- [Stripe API](https://stripe.com/docs/api)

## 🤝 Need Help?

1. Check `README.md` for feature documentation
2. Check `DEPLOYMENT.md` for deployment help
3. Check `N8N_WORKFLOWS.md` for automation setup

## ✅ Development Checklist

- [ ] Set up Supabase project
- [ ] Run database schema
- [ ] Configure environment variables
- [ ] Test database connection
- [ ] Build leads page
- [ ] Build appointments page
- [ ] Build billing page
- [ ] Build admin console
- [ ] Add Google Sheets import
- [ ] Add messaging API
- [ ] Set up cron jobs
- [ ] Test all webhooks
- [ ] Deploy to Vercel
- [ ] Configure production webhooks

---

**Ready to build?** Start with the dashboard (already included), then move to leads, then appointments. The hardest parts (webhooks, billing logic) are already done!

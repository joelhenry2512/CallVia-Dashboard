# Callvia - AI Appointment Setting SaaS

Complete AI-powered appointment setting platform for life insurance agents. Built with Next.js, Supabase, Retell AI, Cal.com, and Stripe.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Retell AI account
- Cal.com account
- Stripe account
- SendGrid account (for email)

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Retell AI
RETELL_API_KEY=your_retell_key

# Cal.com
CALCOM_API_KEY=your_calcom_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of callvia-schema.sql
# Paste into Supabase SQL Editor and run
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
callvia/
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── retell/route.ts      # Retell AI webhook
│   │   │   ├── calcom/route.ts      # Cal.com webhook
│   │   │   └── stripe/route.ts      # Stripe webhook
│   │   ├── leads/
│   │   │   └── import/route.ts      # CSV lead import
│   │   └── appointments/
│   │       └── verify/route.ts      # Show verification
│   ├── dashboard/
│   │   └── page.tsx                 # Main dashboard
│   ├── campaigns/
│   │   └── page.tsx                 # Campaign manager
│   ├── leads/
│   │   └── page.tsx                 # Leads view
│   ├── appointments/
│   │   └── page.tsx                 # Appointments calendar
│   ├── billing/
│   │   └── page.tsx                 # Billing & invoices
│   └── admin/
│       └── page.tsx                 # Admin console
├── components/
│   ├── ui/                          # Reusable UI components
│   └── layouts/                     # Layout components
└── lib/
    ├── supabase.ts                  # Supabase client
    ├── stripe.ts                    # Stripe client
    └── utils.ts                     # Helper functions
```

## 🔧 Core Features

### 1. Dashboard
- Real-time KPIs (calls, appointments, show rate)
- Performance charts
- Next milestone tracker

### 2. Campaign Management
- CSV lead upload
- Google Sheets integration
- Start/pause campaigns
- Progress tracking

### 3. AI Calling (Retell)
- Automated outbound dialing
- Call transcription & analysis
- Outcome tracking
- Recording storage

### 4. Appointment Booking (Cal.com)
- Embedded calendar
- Automated reminders (24h, 2h, 15m)
- Show verification hierarchy
- Rescheduling flow

### 5. Billing Automation (Stripe)
- Usage-based: $0.20/minute
- Milestone-based: $2,000 per 25 shown appointments
- Automatic invoice generation
- Payment tracking

### 6. Messaging
- SMS & Email reminders
- 2-way conversation tracking
- Message history
- Personalized follow-ups

## 🔗 Integration Setup

### Retell AI

1. Create account at retell.ai
2. Create an AI agent
3. Set webhook URL: `https://yourapp.com/api/webhooks/retell`
4. Copy API key to `.env.local`

### Cal.com

1. Create account at cal.com
2. Create event type
3. Set webhook URL: `https://yourapp.com/api/webhooks/calcom`
4. Subscribe to: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
5. Copy API key to `.env.local`

### Stripe

1. Create account at stripe.com
2. Get API keys from dashboard
3. Set webhook URL: `https://yourapp.com/api/webhooks/stripe`
4. Subscribe to: invoice.paid, invoice.payment_failed
5. Copy webhook secret to `.env.local`

### SendGrid

1. Create account at sendgrid.com
2. Create API key
3. Verify sender email
4. Copy API key to `.env.local`

## 📊 Database Schema

Core tables:

- **clients** - Business accounts
- **users** - Login credentials
- **campaigns** - Lead batches
- **leads** - Contact records
- **appointments** - Bookings + show tracking
- **call_logs** - Retell call data
- **messages** - SMS/Email history
- **milestones** - Billing triggers
- **invoices** - Stripe invoices
- **usage_records** - Per-minute billing

## 🔐 Security

- Row Level Security (RLS) enabled
- Service role key for server-side operations
- Webhook signature verification
- Input validation with Zod

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Configure Webhooks

After deployment, update webhook URLs:

- Retell: `https://your-domain.com/api/webhooks/retell`
- Cal.com: `https://your-domain.com/api/webhooks/calcom`
- Stripe: `https://your-domain.com/api/webhooks/stripe`

## 🧪 Testing

### Test Webhooks Locally

Use ngrok to expose localhost:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 3000
ngrok http 3000

# Use ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/webhooks/retell
```

### Test CSV Import

Sample CSV format:

```csv
first_name,last_name,email,phone
John,Doe,john@example.com,+15551234567
Jane,Smith,jane@example.com,+15559876543
```

## 📈 Analytics & Monitoring

Key metrics tracked:

- Total calls & minutes
- Appointments set vs shown
- Show rate (target: 60%+)
- Cost per appointment
- Revenue per client
- Milestone achievement rate

## 🔄 Automation Workflows

### 1. Outbound Dialer
- Trigger: Campaign started
- Action: Retell calls leads sequentially
- Update: Lead status after each call

### 2. Appointment Reminders
- 24 hours before: SMS + Email
- 2 hours before: SMS
- 15 minutes before: SMS

### 3. Show Verification
- Check confirmation hierarchy
- Auto-mark shown after 48h if undisputed
- Trigger milestone check

### 4. Rebook Flow
- Trigger: No-show
- Send reschedule SMS/Email sequence

### 5. Milestone Billing
- Every 25 shown appointments
- Create Stripe invoice ($2,000)
- Send to client automatically

## 🛠 Customization

### Add Custom Fields to Leads

Edit `custom_fields` JSONB column:

```typescript
const lead = {
  first_name: 'John',
  last_name: 'Doe',
  phone: '+15551234567',
  custom_fields: {
    age: 45,
    policy_type: 'term_life',
    coverage_amount: 500000
  }
}
```

### Adjust Billing Rates

Update client settings:

```sql
UPDATE clients
SET 
  per_minute_rate = 0.25,
  milestone_amount = 2500,
  milestone_interval = 20
WHERE id = 'client_uuid';
```

## 🆘 Support

For issues or questions:

1. Check documentation
2. Review error logs in Supabase
3. Test webhooks with request logs
4. Verify environment variables

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for life insurance agents

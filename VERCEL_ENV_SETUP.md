# 🚀 Vercel Deployment & Environment Variables Guide

## Quick Start Checklist

### Phase 1: Deploy to Vercel (Get Your URL First)

1. **Import your GitHub repo to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import `joelhenry2512/CallVia-Dashboard`
   - Click "Deploy" (it will fail, that's OK!)

2. **You'll get a URL like:** `https://callvia-dashboard.vercel.app`

3. **Save this URL** - you'll need it for webhook configuration

---

## Phase 2: Set Up Required Services

### 1️⃣ **Supabase** (Database - Required)

**Sign up:** https://supabase.com

**Get credentials:**
1. Create a new project
2. Go to **Settings** → **API**
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

**Set up database:**
1. Go to **SQL Editor**
2. Open `/Users/joelhenry/CallVia-Dashboard/callvia-schema.sql`
3. Copy all the SQL
4. Paste and run it in Supabase SQL Editor

---

### 2️⃣ **Retell AI** (Voice Calls - Required)

**Sign up:** https://retell.ai

**Get credentials:**
1. Create account and verify phone
2. Go to **API Keys** → Copy API key → `RETELL_API_KEY`
3. Create an AI Agent for appointment setting
4. Copy Agent ID → `NEXT_PUBLIC_RETELL_AGENT_ID`

**Configure webhook:**
- Webhook URL: `https://your-app.vercel.app/api/webhooks/retell`

---

### 3️⃣ **Cal.com** (Appointments - Required)

**Sign up:** https://cal.com

**Get credentials:**
1. Sign up and create account
2. Create an event type (e.g., "30min Appointment")
3. Go to **Advanced** → **API Key** → Create key → `CALCOM_API_KEY`
4. Copy embed URL → `NEXT_PUBLIC_CALCOM_EMBED_URL` (e.g., `https://cal.com/yourname/30min`)

**Configure webhook:**
1. Go to **Settings** → **Webhooks**
2. Add webhook: `https://your-app.vercel.app/api/webhooks/calcom`
3. Subscribe to: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`

---

### 4️⃣ **Stripe** (Billing - Required)

**Sign up:** https://stripe.com (use Test Mode first)

**Get credentials:**
1. Go to **Developers** → **API Keys**
2. Copy **Test** keys:
   - Secret key → `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)

**Configure webhook:**
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Subscribe to: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

---

### 5️⃣ **Email (Optional - choose one)**

**Option A: Resend (Recommended - Free 3000/month)**
- Sign up: https://resend.com
- Create API key → `RESEND_API_KEY`
- Use: `RESEND_FROM_EMAIL=noreply@yourdomain.com`
- Set: `EMAIL_PROVIDER=resend`

**Option B: SendGrid**
- Sign up: https://sendgrid.com
- Create API key → `SENDGRID_API_KEY`
- Set: `EMAIL_PROVIDER=sendgrid`

**Option C: Skip for now**
- Set: `EMAIL_PROVIDER=none`

---

### 6️⃣ **SMS (Optional)**

**MessageBird:**
- Sign up: https://messagebird.com
- Create API key → `MESSAGEBIRD_API_KEY`

**OR Telnyx:**
- Sign up: https://telnyx.com
- Create API key → `TELNYX_API_KEY`

---

## Phase 3: Add Variables to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these variables one by one:**

```env
# REQUIRED - Core Services

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

RETELL_API_KEY=sk-test-xxxxx
NEXT_PUBLIC_RETELL_AGENT_ID=agent_xxxxx

CALCOM_API_KEY=cal_test_xxxxx
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/yourusername/30min

STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# REQUIRED - App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# OPTIONAL - Email (choose one)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OR Skip email:
# EMAIL_PROVIDER=none

# OPTIONAL - SMS
SMS_PROVIDER=messagebird
MESSAGEBIRD_API_KEY=xxxxx
```

3. **For each variable:**
   - Toggle: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments**
   - Click **...** on latest deployment
   - Click **Redeploy**

---

## Phase 4: Test Your Deployment

1. Visit: `https://your-app.vercel.app`
2. Check for errors in **Vercel Logs**
3. Test basic navigation

---

## 📋 Summary Checklist

### Must Have:
- [x] Vercel deployment created
- [ ] Supabase project created + database schema run
- [ ] Retell AI account + agent created
- [ ] Cal.com account + event type created
- [ ] Stripe account (test mode)
- [ ] Environment variables added to Vercel
- [ ] Redeployed after adding variables

### Nice to Have:
- [ ] Email service configured (Resend recommended)
- [ ] SMS service configured
- [ ] Webhooks tested

---

## 🆘 Quick Troubleshooting

**"Build failed"**
→ Check Vercel logs for missing environment variables

**"Cannot connect to database"**
→ Verify Supabase URL and keys are correct

**"Webhooks not working"**
→ Make sure URLs are: `https://your-app.vercel.app/api/webhooks/[retell|calcom|stripe]`

**"401 Unauthorized"**
→ Check API keys are correct and active

---

## 🎯 Next Steps After Success

1. Create your first test client in the admin panel
2. Create a test campaign
3. Import sample leads
4. Test the full flow
5. Switch to production keys when ready

---

Need help? Check the deployment logs in Vercel!


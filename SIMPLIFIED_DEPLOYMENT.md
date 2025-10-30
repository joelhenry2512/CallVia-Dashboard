# 🚀 Simplified CallVia Deployment Guide

## Deploy Now - No Email Service Required!

You can deploy CallVia right now without SendGrid or any email service.

---

## ✅ Minimum Required Environment Variables

Here's everything you **actually need** to deploy:

```env
# ========================================
# REQUIRED (5 services)
# ========================================

# 1. Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Retell AI (AI Calling)
RETELL_API_KEY=sk_...
NEXT_PUBLIC_RETELL_AGENT_ID=agent_...

# 3. Cal.com (Scheduling)
CALCOM_API_KEY=cal_live_...
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/your-username/30min

# 4. Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 5. App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# ========================================
# OPTIONAL (Add later when needed)
# ========================================

# Email - Skip entirely or set to 'none'
EMAIL_PROVIDER=none

# Phone Number - Only for programmatic outbound calls
# RETELL_PHONE_NUMBER=+1234567890
```

---

## 🎯 5-Step Deployment Process

### **Step 1: Deploy to Vercel (2 minutes)**

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import **"CallVia-Dashboard"** from GitHub
4. Click **"Deploy"** (skip environment variables for now)

### **Step 2: Set Up Supabase (5 minutes)**

1. Go to [supabase.com](https://supabase.com) → Create project
2. Wait for project to be ready (~2 minutes)
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key
5. Go to **SQL Editor**
6. Copy entire `callvia-schema.sql` file
7. Paste and click **"Run"**
8. Verify 15 tables were created

### **Step 3: Get API Keys (10 minutes total)**

**Retell AI (3 minutes):**
1. Sign up at [retell.ai](https://retell.ai)
2. Create an AI agent
3. Copy API key and Agent ID

**Cal.com (3 minutes):**
1. Sign up at [cal.com](https://cal.com)
2. Settings → Developer → API Keys → Create New
3. Copy API key
4. Event Types → Copy your booking URL

**Stripe (4 minutes):**
1. Sign up at [stripe.com](https://stripe.com)
2. Use **Test Mode** (toggle in top right)
3. Developers → API Keys
4. Copy Test keys (they start with `sk_test_` and `pk_test_`)
5. Developers → Webhooks → Add endpoint
6. URL: `https://your-app.vercel.app/api/webhooks/stripe`
7. Events: Select `invoice.paid`, `invoice.payment_failed`
8. Copy webhook secret

### **Step 4: Add to Vercel (5 minutes)**

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable from Step 2 & 3
4. Select **Production, Preview, Development** for each
5. Click **Save**

### **Step 5: Redeploy (1 minute)**

1. Go to **Deployments** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. ✅ **Done!** Your app is live!

---

## 📧 About Email (You Asked About This!)

### **You Don't Need Email to Deploy!**

The app works perfectly without any email service:

```env
EMAIL_PROVIDER=none
```

**What happens:**
- ✅ App works normally
- ✅ Emails are logged to console (visible in Vercel logs)
- ✅ No actual emails sent
- ✅ Zero configuration needed
- ✅ Zero cost

### **If You Want Email Later:**

**I recommend Resend instead of SendGrid:**

1. Go to [resend.com](https://resend.com) (2 minutes)
2. Get API key
3. Add to Vercel:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
4. Redeploy

**Why Resend?**
- ✅ 3,000 emails/month free (vs SendGrid's 100/day)
- ✅ Much easier setup
- ✅ No domain verification needed for testing
- ✅ Modern API

See `EMAIL_OPTIONS.md` for full comparison.

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] App loads at your Vercel URL
- [ ] Visit `/dashboard` - should show empty dashboard
- [ ] No errors in browser console
- [ ] Create test client in Supabase:
  ```sql
  INSERT INTO clients (name, email, company_name)
  VALUES ('Test Company', 'test@example.com', 'Test Inc')
  RETURNING *;
  ```
- [ ] Visit `/campaigns` and create test campaign
- [ ] Visit `/leads` - should show empty leads list
- [ ] Visit `/appointments` - should work
- [ ] Visit `/billing` - should show empty invoices

**Then configure webhooks:**

- [ ] Retell: Settings → Webhook URL → `https://your-app.vercel.app/api/webhooks/retell`
- [ ] Cal.com: Settings → Webhooks → Add `https://your-app.vercel.app/api/webhooks/calcom`
- [ ] Stripe: Already done in Step 3!

---

## 🆘 Common Issues

### **Issue: "Unable to connect to database"**
- Check Supabase URL and keys are correct
- Make sure you copied all 3 Supabase values
- Verify Supabase project is not paused

### **Issue: "Module not found" errors**
- Wait for Vercel build to complete
- Check build logs for specific errors
- Redeploy if needed

### **Issue: "Invalid API key"**
- Double-check each API key
- Make sure no extra spaces when copying
- Verify you're using correct environment (test vs live)

---

## 🎉 You're Live!

Once deployed, you'll have:

✅ **Full dashboard** at `https://your-app.vercel.app/dashboard`
✅ **Campaign management** at `/campaigns`
✅ **Lead tracking** at `/leads`
✅ **Appointment scheduling** at `/appointments`
✅ **Billing & invoices** at `/billing`
✅ **Admin console** at `/admin`

---

## 📚 Additional Resources

- **Email Options:** See `EMAIL_OPTIONS.md`
- **Full Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Vercel Instructions:** See `DEPLOY_TO_VERCEL.md`
- **Cal.com Setup:** Ask me how to get Cal.com API keys
- **Any Questions:** Just ask!

---

**Total setup time: ~25 minutes**
**Required accounts: 5 (Vercel, Supabase, Retell, Cal.com, Stripe)**
**Cost to start: $0 (all have free tiers)**

Ready to deploy? Let's do it! 🚀

# 🚀 CallVia Dashboard - Deployment Guide

## Deployed to Vercel

Your CallVia Dashboard is now deployed and ready to configure!

---

## 📋 Environment Variables Required

After deployment, add these environment variables in the Vercel Dashboard:

### **1. Supabase Configuration** (Required)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**How to get these:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing
3. Go to Settings → API
4. Copy the Project URL and API keys

### **2. Retell AI** (Required for AI calling)
```
RETELL_API_KEY=your_retell_api_key
RETELL_PHONE_NUMBER=your_retell_phone_number
NEXT_PUBLIC_RETELL_AGENT_ID=your_agent_id
```

**How to get these:**
1. Go to [retell.ai](https://retell.ai)
2. Create account and agent
3. Copy API key from dashboard
4. Note your phone number and agent ID

### **3. Cal.com** (Required for scheduling)
```
CALCOM_API_KEY=your_calcom_api_key
NEXT_PUBLIC_CALCOM_EMBED_URL=your_calcom_event_url
```

**How to get these:**
1. Go to [cal.com](https://cal.com)
2. Settings → Developer → API Keys
3. Create new API key
4. Get your event type URL for embedding

### **4. Stripe** (Required for billing)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get these:**
1. Go to [stripe.com](https://stripe.com/dashboard)
2. Developers → API keys
3. Copy Secret and Publishable keys
4. Set up webhook for your Vercel URL (see below)

### **5. SendGrid** (Required for emails)
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CallVia
```

**How to get these:**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Settings → API Keys
3. Create new API key
4. Verify sender email

### **6. App Configuration**
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## 🔧 Setup Steps After Deployment

### **Step 1: Set Up Supabase Database**

1. Go to your Supabase project
2. Click on **SQL Editor**
3. Copy the entire contents of `callvia-schema.sql`
4. Paste and click **Run**
5. Verify all 15 tables were created

### **Step 2: Add Environment Variables to Vercel**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable from the list above
4. Make sure to add them for **Production**, **Preview**, and **Development**
5. Click **Save**

### **Step 3: Configure Webhooks**

After getting your Vercel deployment URL (e.g., `https://callvia-dashboard.vercel.app`):

#### **Retell AI Webhook:**
1. Go to Retell AI dashboard
2. Agent Settings → Webhook URL
3. Set to: `https://your-app.vercel.app/api/webhooks/retell`

#### **Cal.com Webhook:**
1. Go to Cal.com → Settings → Webhooks
2. Add new webhook
3. URL: `https://your-app.vercel.app/api/webhooks/calcom`
4. Subscribe to events:
   - BOOKING_CREATED
   - BOOKING_RESCHEDULED
   - BOOKING_CANCELLED

#### **Stripe Webhook:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - invoice.paid
   - invoice.payment_failed
   - invoice.payment_action_required
5. Copy the webhook secret and add to Vercel environment variables

### **Step 4: Redeploy**

After adding all environment variables:
1. Go to Vercel dashboard
2. Click **Deployments**
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger automatic deployment

---

## 🧪 Testing Your Deployment

### **1. Test Database Connection**
Visit: `https://your-app.vercel.app/dashboard`
- Should load without errors
- Check browser console for any issues

### **2. Test API Routes**
```bash
# Test Retell webhook (replace with your URL)
curl -X POST https://your-app.vercel.app/api/webhooks/retell \
  -H "Content-Type: application/json" \
  -d '{"event_type":"call.started","call_id":"test123"}'
```

### **3. Create Test Client**
Run this in Supabase SQL Editor:
```sql
INSERT INTO clients (name, email, company_name)
VALUES ('Test Company', 'test@example.com', 'Test Insurance Inc.')
RETURNING *;
```

### **4. Import Test Leads**
1. Go to `/campaigns`
2. Create new campaign
3. Upload CSV with test leads
4. Verify leads appear in `/leads`

---

## 📊 Monitoring

### **Check Vercel Logs:**
1. Go to Vercel Dashboard
2. Click **Logs** tab
3. Monitor for any errors

### **Check Supabase:**
1. Go to Supabase Dashboard
2. Click **Database** → **Tables**
3. Verify data is being inserted

### **Check Stripe:**
1. Go to Stripe Dashboard
2. Developers → Events
3. Monitor webhook deliveries

---

## 🔒 Security Checklist

- ✅ All API keys are in environment variables (not in code)
- ✅ `.env.local` is in `.gitignore`
- ✅ Supabase RLS (Row Level Security) is enabled
- ✅ Webhook signatures are verified
- ✅ HTTPS is enforced (automatic with Vercel)

---

## 🆘 Troubleshooting

### **Issue: "Unable to connect to database"**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify Supabase project is not paused

### **Issue: "Webhook not receiving data"**
- Check webhook URL is correct (include https://)
- Check webhook secret is configured
- Look at Vercel logs for errors
- Verify payload format in external service

### **Issue: "Environment variables not working"**
- Redeploy after adding variables
- Check variable names exactly match
- Verify they're set for correct environment

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase Setup Guide](https://supabase.com/docs/guides/getting-started)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## 🎉 You're All Set!

Once you've completed the steps above, your CallVia Dashboard will be fully operational!

**Questions?** Check the logs or review the documentation files in the repository.

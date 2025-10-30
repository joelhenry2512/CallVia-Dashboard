# 🚀 Deploy CallVia Dashboard to Vercel

## Quick Deployment Guide

Follow these steps to deploy your CallVia Dashboard to Vercel:

---

## Option 1: Deploy via Vercel Dashboard (Recommended - Easiest)

### **Step 1: Push Your Code to GitHub**

Your code is already on GitHub at:
```
https://github.com/joelhenry2512/CallVia-Dashboard
Branch: claude/work-in-progress-011CUeATwrtWqbbGoH3Te1ih
```

**First, merge this branch to main:**
```bash
# Switch to main branch
git checkout main

# Merge the work-in-progress branch
git merge claude/work-in-progress-011CUeATwrtWqbbGoH3Te1ih

# Push to main
git push origin main
```

### **Step 2: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **"joelhenry2512/CallVia-Dashboard"**
5. Configure your project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (leave default)
   - **Output Directory:** `.next` (leave default)
6. Click **"Deploy"** (don't add environment variables yet)

### **Step 3: Wait for Initial Deployment**

Vercel will deploy your app. This first deployment will fail or show errors because environment variables are not set yet. That's expected!

### **Step 4: Add Environment Variables**

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add all required variables (see list below)
4. Click **Save** for each variable

### **Step 5: Redeploy**

1. Go to **Deployments** tab
2. Click the three dots (**...**) on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### **Step 6: Configure Webhooks**

Once deployed, use your Vercel URL to configure webhooks in:
- Retell AI
- Cal.com
- Stripe

---

## Option 2: Deploy via Vercel CLI

### **Step 1: Login to Vercel**
```bash
cd /home/user/CallVia-Dashboard
vercel login
```

### **Step 2: Deploy**
```bash
# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? callvia-dashboard
# - Directory? ./ (just press Enter)
# - Override settings? No
```

### **Step 3: Add Environment Variables**

After deployment, you have two options:

**Option A: Via Vercel Dashboard**
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add all variables from the list below

**Option B: Via CLI**
```bash
# Add each environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your value when prompted
# Repeat for all variables
```

### **Step 4: Redeploy**
```bash
vercel --prod
```

---

## 📋 Required Environment Variables

Copy these and fill in your actual values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Retell AI
RETELL_API_KEY=sk_test_...
RETELL_PHONE_NUMBER=+1234567890
NEXT_PUBLIC_RETELL_AGENT_ID=agent_...

# Cal.com
CALCOM_API_KEY=cal_live_...
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/your-username/30min

# Stripe
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CallVia

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## 🔧 After Deployment Checklist

- [ ] All environment variables are added
- [ ] Application loads without errors
- [ ] Database schema is run in Supabase
- [ ] Webhooks are configured in external services
- [ ] Test client is created in database
- [ ] Test CSV import works
- [ ] Test appointment verification
- [ ] Test billing calculations

---

## 🌐 Your Deployment URLs

After deployment, you'll have:

**Production URL:**
```
https://callvia-dashboard.vercel.app (or your custom domain)
```

**API Endpoints:**
```
https://your-app.vercel.app/api/webhooks/retell
https://your-app.vercel.app/api/webhooks/calcom
https://your-app.vercel.app/api/webhooks/stripe
https://your-app.vercel.app/api/leads/import
https://your-app.vercel.app/api/appointments/verify
```

---

## 🎯 Next Steps After Deployment

1. **Set up Supabase:**
   - Run `callvia-schema.sql` in SQL Editor
   - Create test client
   - Verify RLS policies

2. **Configure Webhooks:**
   - Retell AI → Agent Settings → Webhook URL
   - Cal.com → Settings → Webhooks
   - Stripe → Developers → Webhooks

3. **Test Everything:**
   - Visit `/dashboard`
   - Create campaign
   - Import leads
   - Test appointment flow
   - Check billing

4. **Go Live:**
   - Switch to production API keys
   - Update webhook URLs
   - Test end-to-end flow
   - Monitor logs

---

## 🆘 Need Help?

**Common Issues:**

1. **Build fails with "Module not found"**
   - Run `npm install` locally
   - Commit `package-lock.json`
   - Redeploy

2. **Environment variables not working**
   - Make sure they're set for "Production"
   - Redeploy after adding variables
   - Check for typos in variable names

3. **Database connection errors**
   - Verify Supabase URL and keys
   - Check Supabase project is not paused
   - Test connection from local environment

4. **Webhooks not firing**
   - Check webhook URLs are correct
   - Look at Vercel logs for errors
   - Verify payload format in external service

---

## 📚 Documentation

For detailed information about environment variables and setup, see:
- `DEPLOYMENT_GUIDE.md` - Complete setup instructions
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Development setup

---

**Ready to deploy? Let's go! 🚀**

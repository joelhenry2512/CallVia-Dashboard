# 🔗 Supabase Setup Guide

## Quick Steps to Get Your Supabase Credentials

### 1. Create/Open Supabase Project
1. Go to https://supabase.com
2. Sign in or create account
3. Create a new project or select existing one
4. Wait for project to be ready (takes ~2 minutes)

### 2. Get Your Credentials
1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. You'll see:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
→ Copy this to `NEXT_PUBLIC_SUPABASE_URL`

**API Keys:**
- **anon public** key (starts with `eyJ...`)
→ Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **service_role** key (starts with `eyJ...`) - **KEEP SECRET!**
→ Copy to `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Database Schema
1. In Supabase dashboard
2. Go to **SQL Editor**
3. Open file: `callvia-schema.sql` from this repo
4. Copy all SQL
5. Paste into SQL Editor
6. Click **Run**

### 4. Add to Vercel

**Option A: Via Vercel CLI** (I can do this for you)
Just provide me:
- Your Supabase Project URL
- Your anon key
- Your service_role key

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select "call-via-dashboard" project
3. Go to **Settings** → **Environment Variables**
4. Add each variable (enable Production, Preview, Development)
5. Click **Save**
6. Redeploy

---

## Variables to Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Add all 3 variables
- Enable for **Production**, **Preview**, and **Development**
- Click **Save** for each

---

## After Adding Variables

1. **Redeploy** your project
2. Vercel will now use your real Supabase credentials
3. Your app will connect to your database

---

**Once you provide your Supabase credentials, I can add them to Vercel for you!**


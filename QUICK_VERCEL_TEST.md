# 🚀 Quick Vercel Test Setup

## Get Deployed Fast! (Test Mode)

You can deploy **right now** with dummy values just to get it running!

### In Vercel Dashboard → Environment Variables:

Add these (use the values shown):

```env
# Use these DUMMY values to get build working first
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTE5MjAwMCwiZXhwIjoxOTYwNzY4MDAwfQ.placeholder

RETELL_API_KEY=sk-test-placeholder
NEXT_PUBLIC_RETELL_AGENT_ID=agent_placeholder

CALCOM_API_KEY=cal_test_placeholder
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/placeholder

STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production

EMAIL_PROVIDER=none
```

### Then Redeploy

This will:
- ✅ Get the build working
- ✅ Show you the live site
- ⚠️ Features won't work until you add real keys

---

## Next: Replace With Real Keys

After you see the site working:

1. Sign up for real services (Supabase, Retell, etc.)
2. Get real API keys
3. Replace the dummy values in Vercel
4. Redeploy

See `VERCEL_ENV_SETUP.md` for detailed setup instructions!


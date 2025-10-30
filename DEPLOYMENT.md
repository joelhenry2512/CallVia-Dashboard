# Callvia Deployment Checklist

## Pre-Deployment Setup

### 1. Service Accounts

- [ ] Supabase project created
- [ ] Retell AI account + agent configured
- [ ] Cal.com account + event type setup
- [ ] Stripe account + test mode enabled
- [ ] SendGrid account + sender verified
- [ ] (Optional) MessageBird or Telnyx for SMS

### 2. Database Setup

- [ ] Run `callvia-schema.sql` in Supabase SQL Editor
- [ ] Verify all tables created (15 tables)
- [ ] Check indexes are in place
- [ ] Confirm RLS policies enabled
- [ ] Test auth with sample user

### 3. Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Retell AI
RETELL_API_KEY=key_xxxxx
NEXT_PUBLIC_RETELL_AGENT_ID=agent_xxxxx

# Cal.com
CALCOM_API_KEY=cal_live_xxxxx
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/your-username/30min

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Callvia

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Local Testing

- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:3000
- [ ] Auth flow works (sign up/login)
- [ ] Can create test campaign
- [ ] CSV upload works
- [ ] Dashboard loads data

## Deployment Steps

### Option A: Deploy to Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

#### 4. Set Environment Variables in Vercel

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add all variables from `.env.local`

**IMPORTANT:** Use production keys for production deployment!

```env
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
STRIPE_SECRET_KEY=sk_live_xxxxx
RETELL_API_KEY=live_key_xxxxx
# etc...
```

### Option B: Deploy to Other Platforms

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Post-Deployment Configuration

### 1. Update Webhook URLs

Get your production URL (e.g., `https://callvia.vercel.app`)

#### Retell AI

1. Go to Retell dashboard
2. Navigate to your AI agent
3. Update webhook URL: `https://callvia.vercel.app/api/webhooks/retell`
4. Test webhook with sample event

#### Cal.com

1. Go to Cal.com dashboard → Webhooks
2. Create new webhook
3. URL: `https://callvia.vercel.app/api/webhooks/calcom`
4. Subscribe to events:
   - BOOKING_CREATED
   - BOOKING_RESCHEDULED
   - BOOKING_CANCELLED
5. Save and test

#### Stripe

1. Go to Stripe dashboard → Developers → Webhooks
2. Add endpoint: `https://callvia.vercel.app/api/webhooks/stripe`
3. Select events:
   - invoice.paid
   - invoice.payment_failed
   - customer.subscription.deleted
4. Copy webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 2. Domain Setup (Optional)

#### Add Custom Domain in Vercel

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., `app.callvia.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

#### Update All Webhook URLs

Replace `callvia.vercel.app` with your custom domain in:
- Retell webhook
- Cal.com webhook
- Stripe webhook
- Environment variable `NEXT_PUBLIC_APP_URL`

### 3. Test Production Webhooks

#### Test Retell Webhook

```bash
curl -X POST https://callvia.vercel.app/api/webhooks/retell \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call.started",
    "call_id": "test_123",
    "to_number": "+15551234567"
  }'
```

#### Test Cal.com Webhook

Make a test booking through your Cal.com link and verify:
- Webhook received
- Appointment created in database
- Reminders scheduled

#### Test Stripe Webhook

1. Use Stripe CLI to test locally first:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger invoice.paid
```

2. In production, create a test invoice and verify webhook

### 4. Create First Admin User

```sql
-- Run in Supabase SQL Editor
INSERT INTO clients (name, email, company_name, status)
VALUES ('Admin', 'admin@callvia.com', 'Callvia', 'active');

INSERT INTO users (client_id, email, role, first_name, last_name)
VALUES (
  (SELECT id FROM clients WHERE email = 'admin@callvia.com'),
  'admin@callvia.com',
  'admin',
  'Admin',
  'User'
);
```

### 5. Production Monitoring

- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Enable Vercel Analytics

#### Add Sentry (Optional)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Performance Optimization

### 1. Database Indexes

Verify all indexes are created (already in schema):

```sql
-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### 2. Enable Database Connection Pooling

In Supabase:
1. Go to Settings → Database
2. Enable Connection Pooler
3. Use pooled connection string in production

### 3. Cache Strategy

Add caching headers for static assets:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }
        ]
      }
    ]
  }
}
```

## Security Hardening

### 1. Enable Rate Limiting

Add rate limiting to API routes:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. CORS Configuration

```javascript
// middleware.ts
export function middleware(request) {
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
```

### 3. Secure Environment Variables

- [ ] Never commit `.env.local` to git
- [ ] Use Vercel's encrypted environment variables
- [ ] Rotate keys regularly
- [ ] Use different keys for dev/staging/prod

## Testing Checklist

### Functionality Tests

- [ ] User can sign up / log in
- [ ] Can create campaign
- [ ] Can upload CSV leads
- [ ] Retell webhook creates call logs
- [ ] Cal.com webhook creates appointments
- [ ] Stripe webhook updates invoices
- [ ] Dashboard shows correct stats
- [ ] Reminders are sent
- [ ] Show verification works
- [ ] Milestone billing triggers

### Load Tests

- [ ] Test with 1,000 leads
- [ ] Test with 100 concurrent webhooks
- [ ] Verify database performance
- [ ] Check API response times

## Rollback Plan

If deployment fails:

1. Revert to previous Vercel deployment:
   ```bash
   vercel rollback
   ```

2. Or redeploy last known good commit:
   ```bash
   git checkout <commit-hash>
   vercel --prod
   ```

3. Restore database from backup:
   - Supabase maintains automatic backups
   - Go to Database → Backups to restore

## Go-Live Checklist

- [ ] All webhooks configured and tested
- [ ] Environment variables set correctly
- [ ] Database schema deployed
- [ ] Admin user created
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring tools enabled
- [ ] Test end-to-end flow
- [ ] Documentation updated
- [ ] Team trained on admin panel

## Post-Launch

### Day 1
- Monitor error logs
- Check webhook delivery rates
- Verify billing automation
- Test with real leads

### Week 1
- Review performance metrics
- Optimize slow queries
- Gather user feedback
- Fix reported issues

### Month 1
- Analyze usage patterns
- Plan feature updates
- Scale infrastructure if needed
- Review security logs

---

## Support Contacts

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Retell Support: support@retell.ai
- Stripe Support: https://support.stripe.com

## Emergency Contacts

- Database issues: Supabase dashboard
- Payment failures: Stripe dashboard
- Webhook failures: Check logs in each service
- App downtime: Vercel status page

---

Last updated: October 30, 2025

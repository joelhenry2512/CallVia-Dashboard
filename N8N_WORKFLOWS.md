# n8n Automation Workflows for Callvia

These workflows can be implemented in n8n or as serverless functions.

## Workflow 1: Appointment Reminder System

### Trigger: New Appointment Created

**Steps:**

1. **Webhook Trigger**
   - URL: `/webhook/appointment-created`
   - Method: POST
   - Receives: appointment_id, scheduled_at, lead details

2. **Schedule 24h Reminder**
   - Calculate: scheduled_at - 24 hours
   - Send SMS via MessageBird/Telnyx
   - Send Email via SendGrid
   - Message: "Hi {{first_name}}, reminder: You have an appointment tomorrow at {{time}} with {{agent_name}}. Reply CONFIRM or CANCEL."

3. **Schedule 2h Reminder**
   - Calculate: scheduled_at - 2 hours
   - Send SMS only
   - Message: "Hi {{first_name}}, your appointment is in 2 hours at {{time}}. See you soon!"

4. **Schedule 15m Reminder**
   - Calculate: scheduled_at - 15 minutes
   - Send SMS only
   - Message: "Hi {{first_name}}, your appointment with {{agent_name}} starts in 15 minutes. We're excited to speak with you!"

5. **Update Database**
   - Mark reminder_24h_sent = true
   - Log message in messages table

### n8n Workflow JSON Template:

```json
{
  "name": "Appointment Reminders",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "appointment-reminder",
      "parameters": {
        "path": "appointment-created",
        "responseMode": "onReceived",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Schedule 24h",
      "type": "n8n-nodes-base.schedule",
      "position": [450, 200],
      "parameters": {
        "rule": {
          "interval": [{
            "field": "cronExpression",
            "expression": "{{$json['scheduled_at'] - 86400}}"
          }]
        }
      }
    },
    {
      "name": "Send SMS 24h",
      "type": "n8n-nodes-base.messagebird",
      "position": [650, 200],
      "parameters": {
        "resource": "sms",
        "operation": "send",
        "recipients": "={{$json['lead']['phone']}}",
        "originator": "Callvia",
        "body": "Hi {{$json['lead']['first_name']}}, reminder: You have an appointment tomorrow at {{$json['scheduled_time']}}. Reply CONFIRM or CANCEL."
      }
    },
    {
      "name": "Send Email 24h",
      "type": "n8n-nodes-base.sendGrid",
      "position": [650, 300],
      "parameters": {
        "resource": "email",
        "operation": "send",
        "to": "={{$json['lead']['email']}}",
        "from": "noreply@callvia.com",
        "subject": "Appointment Reminder - Tomorrow",
        "body": "Hi {{$json['lead']['first_name']}},\n\nThis is a reminder that you have an appointment scheduled for tomorrow at {{$json['scheduled_time']}}.\n\nPlease confirm or let us know if you need to reschedule.\n\nBest regards,\nCallvia Team"
      }
    },
    {
      "name": "Update Database",
      "type": "n8n-nodes-base.postgres",
      "position": [850, 250],
      "parameters": {
        "operation": "executeQuery",
        "query": "UPDATE appointments SET reminder_24h_sent = true WHERE id = '{{$json['appointment_id']}}'"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Schedule 24h"}]]
    },
    "Schedule 24h": {
      "main": [[
        {"node": "Send SMS 24h"},
        {"node": "Send Email 24h"}
      ]]
    },
    "Send SMS 24h": {
      "main": [[{"node": "Update Database"}]]
    }
  }
}
```

## Workflow 2: Show Verification Auto-Check

### Trigger: 48 Hours After Appointment

**Steps:**

1. **Scheduled Trigger**
   - Run every hour
   - Query appointments where:
     - scheduled_at < NOW() - 48 hours
     - show_verified = false
     - status = 'scheduled'

2. **Check Verification Status**
   - If client confirmed: Mark as shown
   - If lead confirmed: Mark as shown
   - If call duration > 45s: Mark as shown
   - Else: Mark as no_show

3. **Update Appointment**
   - Set show_verified = true/false
   - Set show_verified_by = 'auto'
   - Set status appropriately

4. **Trigger Milestone Check**
   - Call API: POST /api/appointments/verify
   - This checks if milestone reached

### Implementation as Serverless Function:

```typescript
// api/cron/verify-shows.ts
export async function handler() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get appointments to verify
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, leads(*), call_logs(*)')
    .eq('show_verified', false)
    .eq('status', 'scheduled')
    .lt('scheduled_at', fortyEightHoursAgo.toISOString());

  for (const appointment of appointments || []) {
    let verified = false;
    let verifiedBy = 'auto';

    // Check call duration
    const relatedCalls = appointment.call_logs || [];
    const hasLongCall = relatedCalls.some((call: any) => call.duration_seconds > 45);

    if (hasLongCall) {
      verified = true;
      verifiedBy = 'call_duration';
    }

    // Update appointment
    await supabase
      .from('appointments')
      .update({
        show_verified: verified,
        show_verified_by: verifiedBy,
        show_verified_at: new Date().toISOString(),
        status: verified ? 'shown' : 'no_show',
      })
      .eq('id', appointment.id);

    // Trigger milestone check if shown
    if (verified) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointment.id,
          verified_by: verifiedBy,
          status: 'shown',
        }),
      });
    }

    // Trigger rebook if no-show
    if (!verified) {
      await triggerRebookFlow(appointment);
    }
  }

  return { success: true, processed: appointments?.length || 0 };
}
```

## Workflow 3: Rebook Flow (No-Show Follow-up)

### Trigger: Appointment Marked as No-Show

**Steps:**

1. **Wait 2 Hours**
   - Give buffer time in case of late arrival

2. **Send Initial Rebook SMS**
   - Message: "Hi {{first_name}}, we missed you today! Would you like to reschedule? Reply YES to book a new time."

3. **Wait for Response**
   - If YES → Send Cal.com booking link
   - If NO → Mark as 'not_interested'
   - If no response → Continue sequence

4. **Day 2 Follow-up Email**
   - Subject: "Let's Reschedule - We're Here to Help"
   - Body: Friendly email with Cal.com link

5. **Day 4 Final SMS**
   - Message: "Last chance to reschedule - we'd love to help you find the right coverage. Book here: {{booking_link}}"

6. **Mark Sequence Complete**
   - Update lead status

## Workflow 4: Outbound Dialer (Campaign Execution)

### Trigger: Campaign Started

**Steps:**

1. **Get Campaign Leads**
   - Query leads where:
     - campaign_id = X
     - status = 'new' OR status = 'callback'
     - call_attempts < 3

2. **Loop Through Leads**
   - For each lead (rate-limited):
     - Call Retell API to initiate call
     - Wait 30 seconds between calls
     - Update lead.status = 'contacted'

3. **Respect Calling Hours**
   - Check campaign schedule settings
   - Only call during allowed hours
   - Skip if outside schedule

4. **Handle Callbacks**
   - Prioritize leads with status = 'callback'
   - Respect requested callback time

### Retell API Integration:

```typescript
// lib/retell.ts
export async function initiateCall(lead: any, agentId: string) {
  const response = await fetch('https://api.retell.ai/v1/call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
      to_number: lead.phone,
      from_number: process.env.RETELL_PHONE_NUMBER,
      metadata: {
        lead_id: lead.id,
        campaign_id: lead.campaign_id,
        first_name: lead.first_name,
      },
    }),
  });

  return response.json();
}
```

## Workflow 5: Usage Billing (Monthly)

### Trigger: First Day of Month

**Steps:**

1. **Query Unbilled Usage**
   - Get all usage_records where:
     - billed = false
     - created_at < first day of current month

2. **Group by Client**
   - Sum total minutes
   - Calculate total amount

3. **Create Stripe Invoice**
   - For each client with unbilled usage:
     - Create invoice
     - Add line items for usage
     - Finalize and send

4. **Mark as Billed**
   - Update usage_records.billed = true
   - Link to invoice_id

## Deployment Options

### Option 1: n8n Self-Hosted

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=yourpassword \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Option 2: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-shows",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/monthly-billing",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### Option 3: GitHub Actions

```yaml
# .github/workflows/cron-jobs.yml
name: Scheduled Tasks

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  verify-shows:
    runs-on: ubuntu-latest
    steps:
      - name: Call Verify Endpoint
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/verify-shows \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Monitoring Automation Health

### Add to Dashboard:

- Reminders sent (last 24h)
- Verification checks run (last 24h)
- Rebook sequences triggered
- Failed automations (errors)
- Average response time for workflows

### Alert Conditions:

- Reminder failure rate > 5%
- Verification check hasn't run in 2 hours
- Retell webhook not received in 30 minutes
- Cal.com webhook not received in 30 minutes

---

## Testing Automations

```bash
# Test reminder webhook
curl -X POST http://localhost:3000/webhook/appointment-created \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "123",
    "scheduled_at": "2024-11-01T10:00:00Z",
    "lead": {
      "first_name": "John",
      "phone": "+15551234567",
      "email": "john@example.com"
    }
  }'

# Test verification cron
curl -X POST http://localhost:3000/api/cron/verify-shows
```

---

Choose the automation approach that fits your infrastructure:
- **n8n**: Best for visual workflow management
- **Vercel Cron**: Easiest for Next.js deployments  
- **GitHub Actions**: Good for simple scheduled tasks

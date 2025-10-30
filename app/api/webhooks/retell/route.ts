// app/api/webhooks/retell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const eventType = payload.event_type;

    // Log the event
    await supabase.from('events').insert({
      source: 'retell',
      event_type: eventType,
      payload: payload,
      processed: false,
    });

    // Process based on event type
    switch (eventType) {
      case 'call.started':
        await handleCallStarted(payload);
        break;
      
      case 'call.ended':
        await handleCallEnded(payload);
        break;
      
      case 'call.analyzed':
        await handleCallAnalyzed(payload);
        break;
      
      default:
        console.log('Unhandled Retell event:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Retell webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCallStarted(payload: any) {
  const { call_id, agent_id, from_number, to_number } = payload;

  // Find the lead by phone number
  const { data: lead } = await supabase
    .from('leads')
    .select('id, client_id, campaign_id, call_attempts')
    .eq('phone', to_number)
    .single();

  if (!lead) {
    console.error('Lead not found for phone:', to_number);
    return;
  }

  // Create call log
  await supabase.from('call_logs').insert({
    client_id: lead.client_id,
    lead_id: lead.id,
    campaign_id: lead.campaign_id,
    retell_call_id: call_id,
    direction: 'outbound',
    status: 'started',
    started_at: new Date().toISOString(),
  });

  // Update lead
  await supabase
    .from('leads')
    .update({
      status: 'contacted',
      call_attempts: (lead.call_attempts || 0) + 1,
      last_call_date: new Date().toISOString(),
    })
    .eq('id', lead.id);
}

async function handleCallEnded(payload: any) {
  const {
    call_id,
    end_timestamp,
    call_duration,
    transcript,
    recording_url,
    disconnect_reason,
  } = payload;

  // Find the call log
  const { data: callLog } = await supabase
    .from('call_logs')
    .select('*')
    .eq('retell_call_id', call_id)
    .single();

  if (!callLog) return;

  // Update call log
  await supabase
    .from('call_logs')
    .update({
      status: 'completed',
      duration_seconds: call_duration || 0,
      recording_url,
      transcript,
      ended_at: new Date(end_timestamp).toISOString(),
    })
    .eq('retell_call_id', call_id);

  // Calculate cost (at $0.20/min)
  const minutes = (call_duration || 0) / 60;
  const cost = minutes * 0.20;

  // Create usage record
  await supabase.from('usage_records').insert({
    client_id: callLog.client_id,
    call_id: callLog.id,
    minutes: minutes.toFixed(2),
    rate: 0.20,
    amount: cost.toFixed(2),
    billed: false,
  });
}

async function handleCallAnalyzed(payload: any) {
  const { call_id, call_analysis } = payload;

  // Get the call log
  const { data: callLog } = await supabase
    .from('call_logs')
    .select('*')
    .eq('retell_call_id', call_id)
    .single();

  if (!callLog) return;

  // Extract outcome from analysis
  const outcome = call_analysis?.outcome || 'unknown';
  const summary = call_analysis?.summary || '';

  // Update call log with analysis
  await supabase
    .from('call_logs')
    .update({
      summary,
      outcome,
    })
    .eq('retell_call_id', call_id);

  // Update lead based on outcome
  if (outcome === 'appointment_set') {
    await supabase
      .from('leads')
      .update({ status: 'booked' })
      .eq('id', callLog.lead_id);
  } else if (outcome === 'callback_requested') {
    await supabase
      .from('leads')
      .update({ status: 'callback' })
      .eq('id', callLog.lead_id);
  } else if (outcome === 'not_interested' || outcome === 'dnc') {
    await supabase
      .from('leads')
      .update({ status: 'dnc' })
      .eq('id', callLog.lead_id);
  }
}

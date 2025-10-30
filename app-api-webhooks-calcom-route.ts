// app/api/webhooks/calcom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const eventType = payload.triggerEvent;

    // Log the event
    await supabase.from('events').insert({
      source: 'calcom',
      event_type: eventType,
      payload: payload,
      processed: false,
    });

    // Process based on event type
    switch (eventType) {
      case 'BOOKING_CREATED':
        await handleBookingCreated(payload);
        break;
      
      case 'BOOKING_RESCHEDULED':
        await handleBookingRescheduled(payload);
        break;
      
      case 'BOOKING_CANCELLED':
        await handleBookingCancelled(payload);
        break;
      
      default:
        console.log('Unhandled Cal.com event:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cal.com webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleBookingCreated(payload: any) {
  const {
    uid,
    startTime,
    endTime,
    attendees,
    metadata,
  } = payload;

  // Extract lead info from attendees
  const attendee = attendees[0];
  if (!attendee) return;

  // Find lead by email or phone
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .or(`email.eq.${attendee.email},phone.eq.${attendee.phoneNumber}`)
    .single();

  if (!lead) {
    console.error('Lead not found for booking:', attendee.email);
    return;
  }

  // Create appointment
  const { data: appointment } = await supabase
    .from('appointments')
    .insert({
      client_id: lead.client_id,
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      calcom_booking_id: uid,
      scheduled_at: startTime,
      duration_minutes: Math.round((new Date(endTime) - new Date(startTime)) / 60000),
      status: 'scheduled',
    })
    .select()
    .single();

  // Update lead
  await supabase
    .from('leads')
    .update({
      status: 'booked',
      appointment_id: appointment.id,
    })
    .eq('id', lead.id);

  // Schedule reminders
  await scheduleReminders(appointment.id, startTime);
}

async function handleBookingRescheduled(payload: any) {
  const { uid, startTime, endTime } = payload;

  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('calcom_booking_id', uid)
    .single();

  if (!appointment) return;

  // Update appointment
  await supabase
    .from('appointments')
    .update({
      scheduled_at: startTime,
      duration_minutes: Math.round((new Date(endTime) - new Date(startTime)) / 60000),
      status: 'rescheduled',
      reschedule_count: appointment.reschedule_count + 1,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
      reminder_15m_sent: false,
    })
    .eq('id', appointment.id);

  // Reschedule reminders
  await scheduleReminders(appointment.id, startTime);
}

async function handleBookingCancelled(payload: any) {
  const { uid } = payload;

  const { data: appointment } = await supabase
    .from('appointments')
    .select('lead_id')
    .eq('calcom_booking_id', uid)
    .single();

  if (!appointment) return;

  // Update appointment
  await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('calcom_booking_id', uid);

  // Update lead
  await supabase
    .from('leads')
    .update({ status: 'callback' })
    .eq('id', appointment.lead_id);
}

async function scheduleReminders(appointmentId: string, scheduledAt: string) {
  // This would integrate with your reminder system (n8n or internal scheduler)
  // For now, we'll just log that reminders should be scheduled
  
  const scheduledTime = new Date(scheduledAt);
  
  console.log('Schedule reminders for appointment:', appointmentId, {
    '24h': new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000),
    '2h': new Date(scheduledTime.getTime() - 2 * 60 * 60 * 1000),
    '15m': new Date(scheduledTime.getTime() - 15 * 60 * 1000),
  });
  
  // TODO: Call n8n webhook or create scheduled jobs
}

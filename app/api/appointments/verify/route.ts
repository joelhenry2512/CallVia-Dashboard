// app/api/appointments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointment_id, verified_by, status } = body;

    if (!appointment_id || !verified_by || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, leads(*, clients(*))')
      .eq('id', appointment_id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status,
        show_verified: status === 'shown',
        show_verified_by: verified_by,
        show_verified_at: new Date().toISOString(),
      })
      .eq('id', appointment_id);

    if (updateError) {
      throw updateError;
    }

    // If marked as shown, check for milestone
    if (status === 'shown') {
      await checkMilestone(appointment.client_id);
    }

    // If marked as no-show, trigger rebook flow
    if (status === 'no_show') {
      await triggerRebookFlow(appointment);
    }

    return NextResponse.json({
      success: true,
      appointment_id,
      status,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', message: error.message },
      { status: 500 }
    );
  }
}

async function checkMilestone(clientId: string) {
  // Get client settings
  const { data: client } = await supabase
    .from('clients')
    .select('milestone_interval, milestone_amount')
    .eq('id', clientId)
    .single();

  if (!client) return;

  // Count shown appointments
  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('show_verified', true);

  const shownCount = count || 0;
  const milestoneInterval = client.milestone_interval || 25;

  // Check if we hit a milestone
  if (shownCount % milestoneInterval === 0 && shownCount > 0) {
    const milestoneNumber = Math.floor(shownCount / milestoneInterval);

    // Check if milestone already recorded
    const { data: existingMilestone } = await supabase
      .from('milestones')
      .select('id')
      .eq('client_id', clientId)
      .eq('milestone_number', milestoneNumber)
      .single();

    if (!existingMilestone) {
      // Create milestone record
      const { data: milestone } = await supabase
        .from('milestones')
        .insert({
          client_id: clientId,
          milestone_number: milestoneNumber,
          appointments_shown: shownCount,
          amount: client.milestone_amount,
          status: 'pending',
        })
        .select()
        .single();

      // Create Stripe invoice
      if (milestone) {
        await createMilestoneInvoice(clientId, milestone);
      }
    }
  }
}

async function createMilestoneInvoice(clientId: string, milestone: any) {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('stripe_customer_id, company_name')
    .eq('id', clientId)
    .single();

  if (!client || !client.stripe_customer_id) {
    console.error('Client or Stripe customer not found');
    return;
  }

  try {
    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: client.stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `Milestone ${milestone.milestone_number} - ${milestone.appointments_shown} appointments shown`,
    });

    // Add invoice item
    await stripe.invoiceItems.create({
      customer: client.stripe_customer_id,
      invoice: invoice.id,
      amount: Math.round(milestone.amount * 100), // Convert to cents
      currency: 'usd',
      description: `Milestone ${milestone.milestone_number} Achievement`,
    });

    // Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Save invoice to database
    await supabase.from('invoices').insert({
      client_id: clientId,
      stripe_invoice_id: finalizedInvoice.id,
      invoice_type: 'milestone',
      amount: milestone.amount,
      status: 'open',
      invoice_url: finalizedInvoice.hosted_invoice_url,
      invoice_pdf: finalizedInvoice.invoice_pdf,
      description: `Milestone ${milestone.milestone_number}`,
    });

    // Update milestone
    await supabase
      .from('milestones')
      .update({
        status: 'invoiced',
        stripe_invoice_id: finalizedInvoice.id,
      })
      .eq('id', milestone.id);

    console.log('Milestone invoice created:', finalizedInvoice.id);
  } catch (error) {
    console.error('Stripe invoice creation error:', error);
  }
}

async function triggerRebookFlow(appointment: any) {
  // TODO: Trigger SMS/Email sequence to reschedule
  console.log('Triggering rebook flow for appointment:', appointment.id);
  
  // This would call your messaging API or n8n webhook
  // Example: Send "Let's reschedule" message
}

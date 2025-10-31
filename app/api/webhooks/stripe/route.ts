// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16',
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event
    await supabase.from('events').insert({
      source: 'stripe',
      event_type: event.type,
      payload: event.data.object,
      processed: false,
    });

    // Process based on event type
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      
      default:
        console.log('Unhandled Stripe event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: any) {
  // Find the invoice in our database
  const { data: dbInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('stripe_invoice_id', invoice.id)
    .single();

  if (!dbInvoice) {
    console.error('Invoice not found:', invoice.id);
    return;
  }

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf,
    })
    .eq('stripe_invoice_id', invoice.id);

  // If this was a milestone invoice, update the milestone
  if (dbInvoice.invoice_type === 'milestone') {
    await supabase
      .from('milestones')
      .update({ status: 'paid' })
      .eq('invoice_id', dbInvoice.id);
  }

  // Mark usage records as billed if this was a usage invoice
  if (dbInvoice.invoice_type === 'usage') {
    await supabase
      .from('usage_records')
      .update({ billed: true })
      .eq('invoice_id', dbInvoice.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  // Update invoice status
  await supabase
    .from('invoices')
    .update({ status: 'failed' })
    .eq('stripe_invoice_id', invoice.id);

  // TODO: Send notification to admin and client
  console.log('Invoice payment failed:', invoice.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  // Find client by Stripe customer ID
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!client) return;

  // Pause the client's account
  await supabase
    .from('clients')
    .update({ status: 'suspended' })
    .eq('id', client.id);

  // Pause all active campaigns
  await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('client_id', client.id)
    .eq('status', 'active');
}

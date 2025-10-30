import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Helper: Create a customer
export async function createStripeCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

// Helper: Create an invoice
export async function createInvoice(
  customerId: string,
  amount: number,
  description: string
) {
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    collection_method: 'send_invoice',
    days_until_due: 30,
  });

  await stripe.invoiceItems.create({
    customer: customerId,
    invoice: invoice.id,
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    description,
  });

  return await stripe.invoices.finalizeInvoice(invoice.id);
}

// Helper: Create a usage record
export async function createUsageRecord(
  clientId: string,
  minutes: number,
  callId: string
) {
  const amount = minutes * 0.20; // $0.20 per minute
  return {
    client_id: clientId,
    minutes,
    amount,
    call_id: callId,
    billing_period: new Date().toISOString().slice(0, 7), // YYYY-MM format
  };
}

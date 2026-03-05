import Stripe from 'stripe';
import { sendNotification } from './utils/send-email.js';
import { sendClient } from './utils/zapier.js';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('[Stripe Webhook] Not configured — skipping.');
    return res.status(200).json({ received: true });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('[Stripe] Checkout completed:', session.id);

        // Send to DisputeFox via Zapier
        await sendClient({
          email: session.customer_email || session.customer_details?.email,
          plan: session.metadata?.plan,
          customerName: session.metadata?.customerName,
          stripeCustomerId: session.customer,
          stripeSessionId: session.id,
          amountTotal: session.amount_total,
        });

        // Notify team
        await sendNotification({
          subject: `💳 Payment Received — ${session.metadata?.customerName || session.customer_email} (${session.metadata?.plan})`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;">
              <h2 style="color:#008601;">Payment Received!</h2>
              <p><strong>Customer:</strong> ${session.metadata?.customerName || 'N/A'}</p>
              <p><strong>Email:</strong> ${session.customer_email || session.customer_details?.email}</p>
              <p><strong>Plan:</strong> ${session.metadata?.plan}</p>
              <p><strong>Amount:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
              <p><strong>Stripe Session:</strong> ${session.id}</p>
            </div>
          `,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('[Stripe] Invoice paid:', invoice.id, '$' + (invoice.amount_paid / 100).toFixed(2));
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('[Stripe] Payment failed:', invoice.id);
        await sendNotification({
          subject: `⚠️ Payment Failed — ${invoice.customer_email}`,
          html: `
            <div style="font-family:sans-serif;">
              <h2 style="color:#dc2626;">Payment Failed</h2>
              <p><strong>Customer:</strong> ${invoice.customer_email}</p>
              <p><strong>Amount:</strong> $${(invoice.amount_due / 100).toFixed(2)}</p>
              <p><strong>Invoice:</strong> ${invoice.id}</p>
              <p>Please follow up with this client regarding their payment method.</p>
            </div>
          `,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log('[Stripe] Subscription canceled:', sub.id);
        await sendNotification({
          subject: `🚫 Subscription Canceled — ${sub.id}`,
          html: `
            <div style="font-family:sans-serif;">
              <h2>Subscription Canceled</h2>
              <p><strong>Subscription ID:</strong> ${sub.id}</p>
              <p><strong>Customer:</strong> ${sub.customer}</p>
              <p><strong>Plan:</strong> ${sub.metadata?.plan || 'Unknown'}</p>
            </div>
          `,
        });
        break;
      }

      default:
        console.log('[Stripe] Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
  }

  return res.status(200).json({ received: true });
}

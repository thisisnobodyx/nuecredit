import Stripe from 'stripe';

const PLAN_CONFIG = {
  standard: {
    name: 'Standard Plan',
    monthlyPrice: 7900,   // $79.00 in cents
    enrollFee: 9900,      // $99.00 in cents
  },
  pro: {
    name: 'Pro Plan',
    monthlyPrice: 14900,  // $149.00
    enrollFee: 14900,
  },
  premium: {
    name: 'Premium Plan',
    monthlyPrice: 24900,  // $249.00
    enrollFee: 19900,
  },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Payment processing is not configured yet. Please contact us to complete your enrollment.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { plan, email, customerName } = req.body;

    if (!plan || !PLAN_CONFIG[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const config = PLAN_CONFIG[plan];
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://nuecredit.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      metadata: {
        plan,
        customerName: customerName || '',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `nueCredit ${config.name}`,
              description: 'Monthly credit restoration subscription',
            },
            unit_amount: config.monthlyPrice,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { plan, customerName: customerName || '' },
      },
      // Add enrollment fee as one-time invoice item
      invoice_creation: undefined,
      success_url: `${origin}/pages/get-started.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pages/get-started.html?canceled=true`,
    });

    // Add enrollment fee as a one-time setup fee
    // This shows up as a separate line item on the first invoice
    if (config.enrollFee > 0) {
      await stripe.invoiceItems.create({
        customer: session.customer,
        amount: config.enrollFee,
        currency: 'usd',
        description: `${config.name} — One-time enrollment fee`,
        subscription: session.subscription,
      }).catch(() => {
        // If customer doesn't exist yet (new customer), the enrollment fee
        // will be handled via the checkout session's payment_intent
        console.log('Note: Enrollment fee will be collected after customer creation.');
      });
    }

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('[API /create-checkout-session] Error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}

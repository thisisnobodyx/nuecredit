import { sendNotification, enrollEmailHTML } from './utils/send-email.js';
import { sendLead } from './utils/zapier.js';

export default async function handler(req, res) {
  /* ── CORS preflight ───────────────────────────── */
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName, lastName, email, phone,
      address, zip, plan,
      referralCode, hasReferral,
    } = req.body;

    /* ── Validate ────────────────────────────────── */
    const missing = [];
    if (!firstName) missing.push('first name');
    if (!lastName) missing.push('last name');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');
    if (!plan) missing.push('plan');

    if (missing.length) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const validPlans = ['standard', 'pro', 'premium', 'quickfix'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    /* ── Send email notification ─────────────────── */
    const isQuickFix = plan === 'quickfix';
    const emailResult = await sendNotification({
      subject: isQuickFix
        ? `🔥 Quick Fix Quote Request — ${firstName} ${lastName}`
        : `New Enrollment — ${firstName} ${lastName} (${plan})`,
      html: enrollEmailHTML({ firstName, lastName, email, phone, address, zip, plan, referralCode }),
      replyTo: email,
    });

    /* ── Fire Zapier webhook (DisputeFox lead) ───── */
    const zapierResult = await sendLead({
      firstName,
      lastName,
      email,
      phone,
      address,
      zip,
      plan,
      referralCode: referralCode || null,
      notes: isQuickFix
        ? 'Quick Fix VIP — needs custom quote'
        : `Enrolled in ${plan} plan`,
    });

    /* ── Respond ─────────────────────────────────── */
    return res.status(200).json({
      success: true,
      plan,
      isQuickFix,
      message: isQuickFix
        ? 'Your Quick Fix request has been submitted. A VIP specialist will review your credit report and contact you within 24 hours with a custom quote.'
        : 'Your enrollment has been submitted! Proceed to payment to complete your signup.',
      _debug: process.env.NODE_ENV === 'development' ? { emailResult, zapierResult } : undefined,
    });
  } catch (err) {
    console.error('[API /enroll] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

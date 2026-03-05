import { sendNotification, partnerEmailHTML } from './utils/send-email.js';
import { sendPartner } from './utils/zapier.js';

export default async function handler(req, res) {
  /* ── CORS preflight ───────────────────────────── */
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, role, monthlyClients } = req.body;

    /* ── Validate ────────────────────────────────── */
    const missing = [];
    if (!firstName) missing.push('first name');
    if (!lastName) missing.push('last name');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');

    if (missing.length) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    /* ── Send email notification ─────────────────── */
    const emailResult = await sendNotification({
      subject: `New Partner Application — ${firstName} ${lastName} (${role || 'Not specified'})`,
      html: partnerEmailHTML({ firstName, lastName, email, phone, role, monthlyClients }),
      replyTo: email,
    });

    /* ── Fire Zapier webhook (DisputeFox affiliate) ── */
    const zapierResult = await sendPartner({
      firstName,
      lastName,
      email,
      phone,
      role,
      monthlyClients,
    });

    /* ── Respond ─────────────────────────────────── */
    return res.status(200).json({
      success: true,
      message: 'Your partner application has been submitted! Our team will review and contact you within 48 hours.',
      _debug: process.env.NODE_ENV === 'development' ? { emailResult, zapierResult } : undefined,
    });
  } catch (err) {
    console.error('[API /partner-apply] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

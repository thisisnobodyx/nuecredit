import { sendNotification, contactEmailHTML } from './utils/send-email.js';
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
    const { firstName, lastName, email, phone, topic, message } = req.body;

    /* ── Validate ────────────────────────────────── */
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required.' });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    /* ── Send email notification ─────────────────── */
    const emailResult = await sendNotification({
      subject: `Contact: ${topic || 'General Inquiry'} — ${firstName || ''} ${lastName || ''}`,
      html: contactEmailHTML({ firstName, lastName, email, phone, topic, message }),
      replyTo: email,
    });

    /* ── Fire Zapier webhook (DisputeFox lead) ───── */
    const zapierResult = await sendLead({
      firstName,
      lastName,
      email,
      phone,
      notes: `Topic: ${topic}\n\nMessage: ${message}`,
    });

    /* ── Respond ─────────────────────────────────── */
    return res.status(200).json({
      success: true,
      message: 'Your message has been received. We\'ll respond within 24 hours.',
      _debug: process.env.NODE_ENV === 'development' ? { emailResult, zapierResult } : undefined,
    });
  } catch (err) {
    console.error('[API /contact] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

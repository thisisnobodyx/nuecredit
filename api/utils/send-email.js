import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendNotification({ subject, html, replyTo }) {
  if (!transporter || !process.env.NOTIFICATION_EMAIL) {
    console.log('[Email] Not configured — skipping notification.');
    console.log('[Email] Subject:', subject);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await transporter.sendMail({
      from: `"nueCredit" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      replyTo: replyTo || undefined,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

/* ── Email Templates ─────────────────────────────── */

export function contactEmailHTML({ firstName, lastName, email, phone, topic, message }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#008601;">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${phone || 'Not provided'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Topic</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${topic || 'Not selected'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Message</td>
            <td style="padding:8px;">${message}</td></tr>
      </table>
    </div>
  `;
}

export function enrollEmailHTML({ firstName, lastName, email, phone, address, zip, plan, referralCode }) {
  const planLabels = {
    standard: 'Standard — $99/mo + $99 enrollment',
    pro: 'Pro — $149/mo + $149 enrollment',
    premium: 'Premium — $199/mo + $199 enrollment',
    quickfix: 'Quick Fix (VIP) — Custom Quote',
  };
  return `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#008601;">New Enrollment${plan === 'quickfix' ? ' — Quick Fix Quote Request' : ''}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${phone}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Address</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${address || ''}, ${zip || ''}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Plan</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${planLabels[plan] || plan}</td></tr>
        ${referralCode ? `<tr><td style="padding:8px;font-weight:bold;">Referral Code</td>
            <td style="padding:8px;">${referralCode}</td></tr>` : ''}
      </table>
    </div>
  `;
}

export function partnerEmailHTML({ firstName, lastName, email, phone, role, monthlyClients }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#008601;">New Partner Application</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${phone}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Industry / Role</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${role}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Monthly Clients</td>
            <td style="padding:8px;">${monthlyClients || 'Not specified'}</td></tr>
      </table>
    </div>
  `;
}

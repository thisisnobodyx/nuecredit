import { sendNotification } from './utils/send-email.js';
import { sendLead, sendToSheet } from './utils/zapier.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, email, phone, toolUsed } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const toolLabels = {
      simulator: 'Credit Score Simulator',
      dispute: 'Dispute Letter Generator',
      analyzer: 'Credit Report Analyzer',
    };

    const toolLabel = toolLabels[toolUsed] || toolUsed || 'AI Tool';

    /* Send email notification */
    await sendNotification({
      subject: `🤖 AI Tool Lead — ${toolLabel}`,
      replyTo: email,
      html: `
        <div style="font-family:sans-serif;max-width:600px;">
          <h2 style="color:#008601;">New AI Tool Lead</h2>
          <p style="color:#555;font-size:14px;">Someone used the <strong>${toolLabel}</strong> and submitted their contact info.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">${firstName} ${lastName || ''}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td>
                <td style="padding:8px;border-bottom:1px solid #eee;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Tool Used</td>
                <td style="padding:8px;">${toolLabel}</td></tr>
          </table>
        </div>
      `,
    });

    /* Fire Zapier webhook to DisputeFox */
    await sendLead({
      firstName,
      lastName: lastName || '',
      email,
      phone: phone || '',
      notes: `Lead from nueCredit AI Tool: ${toolLabel}`,
    });

    /* Save to Google Sheets (if configured) */
    await sendToSheet({
      type: 'ai_tool_lead',
      firstName,
      lastName: lastName || '',
      email,
      phone: phone || '',
      toolUsed: toolLabel,
      date: new Date().toLocaleDateString('en-US'),
      time: new Date().toLocaleTimeString('en-US'),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[API /tool-lead] Error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

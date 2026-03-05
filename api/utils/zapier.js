/**
 * Zapier Webhook Utility
 * Sends form data to Zapier webhooks for DisputeFox integration.
 * Gracefully skips if webhook URLs are not configured.
 */

export async function fireWebhook(webhookUrl, data) {
  if (!webhookUrl) {
    console.log('[Zapier] Webhook URL not configured — skipping.');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'nuecredit-website',
        timestamp: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      console.log('[Zapier] Webhook delivered successfully.');
      return { sent: true };
    } else {
      console.error('[Zapier] Webhook failed:', res.status, res.statusText);
      return { sent: false, reason: `HTTP ${res.status}` };
    }
  } catch (err) {
    console.error('[Zapier] Webhook error:', err.message);
    return { sent: false, reason: err.message };
  }
}

/** Send lead data to DisputeFox via Zapier */
export function sendLead(data) {
  return fireWebhook(process.env.ZAPIER_WEBHOOK_LEAD, {
    type: 'lead',
    ...data,
  });
}

/** Send new client data to DisputeFox via Zapier */
export function sendClient(data) {
  return fireWebhook(process.env.ZAPIER_WEBHOOK_CLIENT, {
    type: 'client',
    ...data,
  });
}

/** Send partner/affiliate data to DisputeFox via Zapier */
export function sendPartner(data) {
  return fireWebhook(process.env.ZAPIER_WEBHOOK_PARTNER, {
    type: 'partner',
    ...data,
  });
}

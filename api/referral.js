export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Referral code is required.' });
    }

    // MVP: Simple validation — accepts any alphanumeric code
    // In production, this would validate against DisputeFox affiliate IDs
    // or a database of partner referral codes
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleanCode.length < 3 || cleanCode.length > 20) {
      return res.status(400).json({ error: 'Invalid referral code format.', valid: false });
    }

    // For now, all well-formatted codes are accepted
    // DisputeFox will handle actual partner validation
    return res.status(200).json({
      valid: true,
      code: cleanCode,
      message: 'Referral code accepted. Your partner will receive credit for this referral.',
    });
  } catch (err) {
    console.error('[API /referral] Error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

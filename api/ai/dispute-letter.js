export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured yet. Please try again later.' });
  }

  try {
    const { disputeType, creditorName, accountLast4, reason, bureau, personalDetails } = req.body;

    if (!disputeType || !reason) {
      return res.status(400).json({ error: 'Dispute type and reason are required.' });
    }

    const systemPrompt = `You are a credit dispute letter specialist. You help consumers draft professional dispute letters to credit bureaus under their rights granted by the Fair Credit Reporting Act (FCRA), specifically Section 611.

Your letters must:
- Be professional, firm, and legally sound
- Reference relevant FCRA sections (Section 611, Section 623 when applicable)
- Include proper formatting: date, bureau address, consumer info placeholder, RE line, body, signature
- Request investigation within the legally required 30-day window
- Request deletion or correction of disputed items
- Include a statement about providing documentation if needed
- Never include actual personal information — use [YOUR NAME], [YOUR ADDRESS], [SSN LAST 4], etc. as placeholders
- Never provide legal advice — frame as the consumer exercising their rights

Available bureaus and addresses:
- Equifax: P.O. Box 740256, Atlanta, GA 30374
- Experian: P.O. Box 4500, Allen, TX 75013
- TransUnion: P.O. Box 2000, Chester, PA 19016

Respond in JSON format with:
- letter: string (the full dispute letter with proper formatting)
- bureau: string (which bureau to send to)
- bureauAddress: string
- filingInstructions: string[] (3-4 step instructions for sending)
- tips: string[] (2-3 helpful tips)
- disclaimer: string`;

    const userPrompt = `Generate a dispute letter with these details:
- Dispute type: ${disputeType}
- Creditor/Company name: ${creditorName || 'Not specified'}
- Account last 4 digits: ${accountLast4 || 'N/A'}
- Reason for dispute: ${reason}
- Bureau to send to: ${bureau || 'All three bureaus'}
${personalDetails ? `- Additional context: ${personalDetails}` : ''}`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[AI] OpenAI error:', err);
      return res.status(502).json({ error: 'AI service temporarily unavailable.' });
    }

    const aiData = await aiRes.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    return res.status(200).json({
      success: true,
      disputeType,
      ...result,
    });
  } catch (err) {
    console.error('[API /ai/dispute-letter] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

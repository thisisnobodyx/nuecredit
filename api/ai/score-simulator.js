export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured yet. Please try again later.' });
  }

  try {
    const { currentScore, action, amount, details } = req.body;

    if (!currentScore || !action) {
      return res.status(400).json({ error: 'Current score and action type are required.' });
    }

    const score = parseInt(currentScore);
    if (isNaN(score) || score < 300 || score > 850) {
      return res.status(400).json({ error: 'Please enter a valid credit score between 300 and 850.' });
    }

    const systemPrompt = `You are a credit score simulation expert. You help consumers understand how specific actions might impact their credit score. You must:
- Always provide a realistic estimated score range (not exact number)
- Explain the FICO scoring factors involved (payment history 35%, amounts owed 30%, length of history 15%, new credit 10%, credit mix 10%)
- Be clear this is an estimate, not a guarantee
- Give practical, actionable advice
- Never provide specific financial or legal advice
- Always note that individual results vary based on full credit profile

You MUST respond with ONLY valid JSON (no markdown, no code fences) with these fields:
- estimatedRange: { low: number, high: number }
- impact: "positive" | "negative" | "neutral"
- explanation: string (2-3 sentences explaining the impact)
- factors: string[] (which FICO factors are affected)
- recommendations: string[] (2-3 actionable tips)
- disclaimer: string`;

    const userPrompt = `Current credit score: ${score}
Action being considered: ${action}
${amount ? `Amount involved: $${amount}` : ''}
${details ? `Additional details: ${details}` : ''}

Simulate the likely impact on this person's credit score.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('[AI] Claude error:', err);
      return res.status(502).json({ error: 'AI service temporarily unavailable.' });
    }

    const aiData = await aiRes.json();
    const rawText = aiData.content[0].text;
    const result = JSON.parse(rawText);

    return res.status(200).json({
      success: true,
      currentScore: score,
      action,
      ...result,
    });
  } catch (err) {
    console.error('[API /ai/score-simulator] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
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

Respond in JSON format with these fields:
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
        temperature: 0.7,
        max_tokens: 800,
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
      currentScore: score,
      action,
      ...result,
    });
  } catch (err) {
    console.error('[API /ai/score-simulator] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

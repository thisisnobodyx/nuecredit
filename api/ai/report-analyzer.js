export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured yet. Please try again later.' });
  }

  try {
    const { reportText, accounts } = req.body;

    if (!reportText && !accounts) {
      return res.status(400).json({ error: 'Please provide credit report details to analyze.' });
    }

    const systemPrompt = `You are a credit report analysis expert. You help consumers understand their credit report and identify opportunities for improvement.

Your analysis must:
- Identify negative items (late payments, collections, charge-offs, inquiries, public records)
- Categorize items by severity and disputability
- Suggest which items are most likely to be successfully disputed
- Prioritize quick wins that could have the biggest score impact
- Provide a realistic timeline for improvement
- Never provide specific financial or legal advice
- Always recommend professional credit restoration for complex cases
- Remind users this is informational analysis only

Respond in JSON format with:
- summary: string (2-3 sentence overview of the credit report)
- score_assessment: string (general assessment of where they stand)
- negativeItems: array of { item: string, severity: "high"|"medium"|"low", disputable: boolean, explanation: string }
- disputeOpportunities: array of { item: string, likelihood: "high"|"medium"|"low", reason: string }
- quickWins: string[] (3-5 immediate actions that could help)
- actionPlan: array of { step: string, timeline: string, impact: string }
- estimatedTimeline: string (how long overall improvement might take)
- disclaimer: string`;

    const input = reportText || JSON.stringify(accounts);
    const userPrompt = `Analyze this credit report information and provide a comprehensive assessment:

${input.substring(0, 4000)}

Identify all negative items, dispute opportunities, and create a prioritized action plan.`;

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
        max_tokens: 2000,
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
      ...result,
    });
  } catch (err) {
    console.error('[API /ai/report-analyzer] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

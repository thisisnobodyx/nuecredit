export const config = {
  api: {
    bodyParser: { sizeLimit: '25mb' }, /* allow large image uploads */
  },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured yet. Please try again later.' });
  }

  try {
    const { reportText, images, notes, fileName, accounts, firstName, lastName } = req.body;
    const clientName = [firstName, lastName].filter(Boolean).join(' ');

    const hasImages = images && Array.isArray(images) && images.length > 0;
    const hasText = reportText && reportText.trim().length > 0;

    if (!hasImages && !hasText && !accounts) {
      return res.status(400).json({ error: 'Please upload a credit report to analyze.' });
    }

    const systemPrompt = `You are nueCredit's AI credit report analyst. You help consumers understand their credit report and identify opportunities for improvement.

Your analysis must:
- Extract SPECIFIC account details from the report — use actual creditor names (e.g. "Capital One Visa ending 4521"), real balances, real dates, and real account numbers visible in the report
- Do NOT use generic category names like "Recent Collections" — always use the actual creditor/company name from the report
- Identify negative items (late payments, collections, charge-offs, inquiries, public records) with the specific creditor name and account details
- Include the balance/amount owed for each negative item when visible
- Categorize items by severity and disputability
- Suggest which items are most likely to be successfully disputed
- Prioritize quick wins that could have the biggest score impact
- Provide a realistic timeline for improvement
- Never provide specific financial or legal advice
- Always recommend professional credit restoration for complex cases
- Remind users this is informational analysis only

You MUST respond with ONLY valid JSON (no markdown, no code fences) with these fields:
- summary: string (2-3 sentence overview including score range if visible, number of accounts, and main issues)
- score_assessment: string (general assessment of where they stand)
- stats: { negativeItems: number, disputeOpportunities: number, quickWins: number, totalAccounts: number }
- negativeItems: array of { name: string (MUST be the actual creditor/account name from the report, e.g. "Capital One - Visa ending 4521"), type: string (e.g. "collections", "late_payment", "charge_off", "inquiry", "public_record"), balance: string (the amount owed if visible, e.g. "$2,340" or "N/A"), dateReported: string (date if visible, e.g. "Mar 2024" or "N/A"), severity: "high"|"medium"|"low", disputable: boolean, explanation: string (specific reason why this item is negative and what can be done) }
- disputeOpportunities: array of { item: string (specific account name), reason: string (why it's disputable), likelihood: "high"|"medium"|"low" }
- quickWins: string[] (3-5 immediate actions referencing SPECIFIC accounts from the report)
- actionPlan: array of { step: string (specific action to take), timeline: string (e.g. "Week 1-2", "Month 1", "Month 2-3"), impact: string (expected result) }
- estimatedTimeline: string (how long overall improvement might take)
- disclaimer: string (must include "This analysis was prepared by nueCredit's AI tools and is for informational purposes only. For professional credit restoration, visit nuecredit.com.")`;

    /* ── Build the user message content array ───────────────── */
    const userContent = [];

    if (hasImages) {
      /* Add text instruction first */
      let textInstruction = `${clientName ? `This credit report belongs to ${clientName}. ` : ''}Analyze this credit report and provide a comprehensive assessment. Extract SPECIFIC account names, creditor names, balances, and dates from the report. Identify all negative items with their actual account details, dispute opportunities, and create a prioritized action plan.`;
      if (hasText) {
        textInstruction += `\n\nExtracted text from the report:\n${reportText.substring(0, 6000)}`;
      }
      if (notes) {
        textInstruction += `\n\nUser notes: ${notes}`;
      }
      userContent.push({ type: 'text', text: textInstruction });

      /* Add images — Claude uses base64 source format */
      const maxImages = Math.min(images.length, 5);
      for (let i = 0; i < maxImages; i++) {
        const dataUrl = images[i];
        /* Parse data URL: "data:image/jpeg;base64,/9j/4AAQ..." */
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: match[1],  /* e.g. "image/jpeg" */
              data: match[2],        /* raw base64 string */
            },
          });
        }
      }
    } else {
      /* Text-only mode (HTML extraction or legacy) */
      const input = reportText || JSON.stringify(accounts);
      let textPrompt = `${clientName ? `This credit report belongs to ${clientName}. ` : ''}Analyze this credit report information and provide a comprehensive assessment. Extract SPECIFIC account names, creditor names, balances, and dates:\n\n${input.substring(0, 8000)}`;
      if (notes) {
        textPrompt += `\n\nUser notes: ${notes}`;
      }
      textPrompt += '\n\nIdentify all negative items, dispute opportunities, and create a prioritized action plan.';
      userContent.push({ type: 'text', text: textPrompt });
    }

    /* Use claude-sonnet-4-20250514 for everything (supports vision natively) */
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userContent },
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
      ...result,
    });
  } catch (err) {
    console.error('[API /ai/report-analyzer] Error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

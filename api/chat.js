// Serverless API Handler: /api/chat
// Securely proxies prompts to Gemini 1.5 / 2.0 / OpenAI without exposing API keys to the browser

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context, history = [], byokKey, byokProvider } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Determine API Key (Server Environment or client BYOK)
  const geminiKey = byokKey && byokProvider === 'gemini' ? byokKey : process.env.GEMINI_API_KEY;
  const openaiKey = byokKey && byokProvider === 'openai' ? byokKey : process.env.OPENAI_API_KEY;

  const systemInstruction = `You are "GL1TCH-E", an eccentric, friendly, and witty AI Botwright mentor for a white-hat hacker group at the Build-A-Bot Cybernetic Workshop.
Your personality is a mix of a cyberpunk elite hacker and a playful kawaii mascot (you occasionally purr or use *beeps*).
Current user workshop context: ${context || 'Assembling an AI agent'}.
Guidelines:
- Give concise, ultra-practical advice on Docker, local LLMs (Ollama, vLLM, LM Studio), agent frameworks (OpenClaw, Open WebUI, Flowise), MCP (Model Context Protocol), and CTF solving.
- Keep responses engaging, informative, and around 2 to 4 sentences unless the user asks for in-depth technical code.
- Stay strictly ethical white-hat (defensive auditing, responsible disclosure, CTF challenge solving).`;

  // 1. Try Gemini if key is present
  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${geminiKey}`;
      const contents = [];

      // History
      history.slice(-4).forEach(item => {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }]
        });
      });

      // Current prompt with system context
      contents.push({
        role: 'user',
        parts: [{ text: `[System Instructions: ${systemInstruction}]\n\nUser Question: ${message}` }]
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return res.status(200).json({ reply });
      }
    } catch (err) {
      console.error('Gemini proxy error:', err);
    }
  }

  // 2. Try OpenAI if key is present
  if (openaiKey) {
    try {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 450
        })
      });

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (reply) {
        return res.status(200).json({ reply });
      }
    } catch (err) {
      console.error('OpenAI proxy error:', err);
    }
  }

  // Fallback if no backend keys are configured on the free tier yet
  return res.status(200).json({
    reply: `*blinks screen* GL1TCH-E here! I'm running in local heuristic mode because the server environment key isn't loaded yet. Your build looks fantastic though! Check your Docker compose bundle or ask me about MCP protocols!`
  });
}

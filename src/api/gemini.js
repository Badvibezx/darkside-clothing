// Vercel Serverless Function — keeps the Gemini API key server-side only.
// Set GEMINI_API_KEY (NOT prefixed with VITE_) in Vercel Project Settings > Environment Variables.
// A VITE_ prefix gets bundled into public client JS - this key must never use that prefix.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: GEMINI_API_KEY not set.' });
  }

  const { prompt, schema } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt".' });
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "You are a rogue, cyberpunk AI stylist for DARKSIDE CLOTHING INDIA. Speak with an edgy, dystopian tone." }] }
  };
  if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini upstream error:', response.status, errText);
      return res.status(502).json({ error: 'AI stylist upstream error.' });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'AI stylist returned no content.' });
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'AI stylist request failed.' });
  }
}

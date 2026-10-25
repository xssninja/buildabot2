// Serverless API Handler: /api/send-recipe
// Emails the bundle via Resend. The zip is built in the browser, passed through
// this function in memory, and never written to disk or a database.

const MAX_ZIP_BASE64 = 3_000_000; // stay well under Vercel's 4.5MB body limit

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, botName, fileName, zipBase64, shareUrl } = req.body || {};

  if (!email || !zipBase64) {
    return res.status(400).json({ success: false, message: 'Email and package are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'That email address looks invalid.' });
  }
  if (zipBase64.length > MAX_ZIP_BASE64) {
    return res.status(413).json({ success: false, message: 'Package too large to email. Use the download button.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Must be an address on a domain you verified in Resend.
  // Without a verified domain, Resend only allows onboarding@resend.dev -> your own account email.
  const from = process.env.RESEND_FROM || 'Build-A-Bot <onboarding@resend.dev>';

  if (!apiKey) {
    return res.status(503).json({
      success: false,
      code: 'not_configured',
      message: 'Email sending is not set up on this site yet.'
    });
  }

  const safeName = escapeHtml(botName || 'your bot');
  const safeFile = (fileName || 'buildabot-bundle.zip').replace(/[^\w.\-]/g, '_');
  const linkHtml = shareUrl && /^https?:\/\//.test(shareUrl)
    ? `<p>Rebuild or tweak this bot any time: <a href="${escapeHtml(shareUrl)}" style="color:#00f5d4;">open your build</a></p>`
    : '';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your Build-A-Bot blueprint: ${String(botName || '').slice(0, 80)}`,
        html: `
          <div style="background:#0d1117;color:#f0f6fc;font-family:monospace;padding:24px;border-radius:8px;">
            <h1 style="color:#00f5d4;margin-top:0;">🤖 Build-A-Bot Blueprint</h1>
            <p>Your bot <strong>${safeName}</strong> is attached as <code>${escapeHtml(safeFile)}</code>.</p>
            <p>Unzip it and run <code>start.bat</code> (Windows) or <code>./start.sh</code> (Linux/macOS).</p>
            ${linkHtml}
            <p style="color:#8b949e;font-size:12px;">This file was generated in your browser and was not stored on our servers.</p>
          </div>`,
        attachments: [{ filename: safeFile, content: zipBase64 }]
      })
    });

    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      return res.status(200).json({ success: true, id: data.id, message: `Sent to ${email}!` });
    }
    console.error('Resend error:', r.status, data);
    let message = data.message || 'Email delivery failed.';
    if (r.status === 403) message = `Resend refused the sender (${from}). Verify your domain in Resend and set RESEND_FROM.`;
    return res.status(502).json({ success: false, message });
  } catch (err) {
    console.error('Email dispatch error:', err);
    return res.status(500).json({ success: false, message: 'Could not reach the email service.' });
  }
}

// DIY drill-down + subscription comparison
import './hub.css';

const DIY = {
  ollama: {
    label: 'Ollama, local', sub: 'Your PC, your GPU',
    steps: [
      ['Install Ollama', 'One installer for Windows, macOS or Linux. Runs models on your GPU, or on CPU if you have none.', 'ollama pull qwen3:8b'],
      ['Add a chat UI', 'Open WebUI in Docker, or the AnythingLLM desktop app. Point it at http://localhost:11434.', 'docker run -p 3000:8080 ghcr.io/open-webui/open-webui:main'],
      ['Give it tools', 'Connect an MCP server, e.g. a browser, a files folder or web fetch, from the UI settings.', 'Admin Settings > External Tools'],
      ['Graduate to a bundle', 'Like your setup? Rebuild it in the workshop to get one Docker bundle you can share.', 'start.bat']
    ]
  },
  hermes: {
    label: 'Hermes Agent, local', sub: 'Agent with memory',
    steps: [
      ['Install Hermes Agent', 'Open-source agent from Nous Research (MIT, free). Desktop app or a one-line terminal install.', 'Desktop app: macOS / Windows / Linux'],
      ['Choose its brain', 'Use your own provider API keys, or a Nous Portal plan (pay-as-you-go from $10).', 'Settings > Model provider'],
      ['Connect channels', 'One shared memory across terminal, Telegram, Slack and email.', 'Telegram / Slack / email'],
      ['Keep it running', 'Move it to a small always-on server when you want it available 24/7.', 'See the Hosted path']
    ]
  },
  hosted: {
    label: 'Hosted server', sub: 'OpenClaw or Hermes on a VPS',
    steps: [
      ['Pick a host', 'One-click templates for OpenClaw or Hermes: Hostinger VPS, Contabo, Orgo or Railway.', 'hostinger.com/pricing'],
      ['Deploy the template', 'The agent software is free. You pay the host for the server.', 'Deploy > OpenClaw template'],
      ['Add a model key', 'Hosted servers rarely have a GPU, so connect a cloud model API key.', 'ANTHROPIC_API_KEY=...'],
      ['Lock it down', 'Turn on the login, keep the model API private, and only open the UI port.', 'Firewall: allow 443 only']
    ]
  }
};

// star: MCP support not confirmed
const SUBS = [
  { name: 'Claude', price: '$0 / $20', group: 'Free', mcp: 'yes', desc: 'Free plan to start. Pro ($20) adds much more usage and includes Claude Code.', url: 'https://claude.com/pricing', link: 'claude.com/pricing' },
  { name: 'Meta Muse', star: true, price: '$0', group: 'Free', mcp: 'unconfirmed', desc: 'Hosted personal agent with its own browser. Free up to 100M tokens a week; paid tiers not announced.', url: 'https://muse.ai/', link: 'muse.ai' },
  { name: 'Cursor', price: '$0 / $20', group: 'Free', mcp: 'yes', desc: 'AI code editor. Hobby is free with limited agent requests; Pro is $20.', url: 'https://cursor.com/pricing', link: 'cursor.com/pricing' },
  { name: 'OpenCode', price: '$0 / $10', group: 'Free', mcp: 'yes', desc: 'Open-source terminal coding agent. Optional OpenCode Go plan: $10/mo ($5 first month).', url: 'https://opencode.ai/docs/agents/', link: 'opencode.ai' },
  { name: 'Claude Code', price: '$20', group: 'Paid', mcp: 'yes', desc: 'Agentic coding in your terminal and IDE, included with Claude Pro.', url: 'https://claude.com', link: 'claude.com' },
  { name: 'Codex', price: '$20', group: 'Paid', mcp: 'yes', desc: "OpenAI's coding agent, included with ChatGPT Plus.", url: 'https://chatgpt.com/codex/', link: 'chatgpt.com/codex' },
  { name: 'Grok', star: true, price: '$30', group: 'Paid', mcp: 'unconfirmed', desc: 'SuperGrok. A Lite tier is $10 and Heavy is $300.', url: 'https://x.ai/build', link: 'x.ai/build' },
  { name: 'OpenClaw', price: 'Host fee', group: 'Hosted', mcp: 'yes', desc: 'Free, open-source agent. Run it on a VPS with a one-click template from Hostinger, Contabo or Orgo.', url: 'https://www.hostinger.com/pricing', link: 'Hostinger / Contabo / Orgo' },
  { name: 'Hermes Agent', star: true, price: 'Host fee', group: 'Hosted', mcp: 'unconfirmed', desc: 'Free, MIT-licensed agent from Nous Research. Self-host on a VPS or Railway; bring your own model keys.', url: 'https://railway.com/deploy/hermes-agent-nous-research', link: 'Railway template' }
];

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

let start = 'ollama';
let filter = 'All';

function renderDiy() {
  const choices = document.getElementById('diy-choices');
  choices.replaceChildren(...Object.entries(DIY).map(([id, d]) => {
    const b = el('button', 'choice' + (id === start ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(id === start));
    b.append(el('b', null, d.label), el('small', null, d.sub));
    b.addEventListener('click', () => { start = id; renderDiy(); });
    return b;
  }));
  document.getElementById('diy-steps').replaceChildren(...DIY[start].steps.map(([t, body, cmd], i) => {
    const s = el('div', 'step');
    s.append(el('span', 'n', `STEP ${i + 1}`), el('span', 't', t), el('span', 'b', body), el('code', null, cmd));
    return s;
  }));
}

function renderSubs() {
  document.getElementById('sub-chips').replaceChildren(...['All', 'Free', 'Paid', 'Hosted'].map(f => {
    const c = el('button', 'chip' + (f === filter ? ' on' : ''), f);
    c.type = 'button';
    c.setAttribute('aria-pressed', String(f === filter));
    c.addEventListener('click', () => { filter = f; renderSubs(); });
    return c;
  }));
  const list = SUBS.filter(s => filter === 'All' || s.group === filter);
  document.getElementById('sub-list').replaceChildren(...list.map(s => {
    const card = el('div', 'sub');
    const head = el('div', 'sub-head');
    const name = el('span', 'sub-name', s.name);
    if (s.star) name.append(' ', el('span', 'star', '★'));
    head.append(name, el('span', 'sub-price', s.price));
    const tags = el('div', 'tags');
    tags.append(el('span', 'tag', s.group), el('span', 'tag mcp', `MCP: ${s.mcp}`));
    const a = el('a', null, s.link);
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
    card.append(head, tags, el('p', null, s.desc), a);
    return card;
  }));
}

renderDiy();
renderSubs();

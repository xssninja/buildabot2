// "Before you download" gate: Docker is required + how to start the bot.
// Shown once per page visit, before the first download or email.
import { HEAD_PARTS, BODY_PARTS } from './botParts.js';

const STYLE = `
.dk-overlay{position:fixed;inset:0;background:rgba(3,6,12,.8);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9999;overflow:auto}
.dk{max-width:600px;width:100%;max-height:calc(100vh - 32px);overflow:auto;background:#0f1626;border:2px solid #00f5d4;border-radius:16px;padding:24px;color:#e6edf3;font-family:'Space Grotesk',system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.dk h2{margin:0 0 6px;font-size:22px;color:#7dfbe6}
.dk p{margin:0 0 12px;line-height:1.5;color:#c9d4e0}
.dk ol{margin:0 0 14px;padding-left:22px;line-height:1.55}
.dk li{margin-bottom:8px}
.dk code{font-family:'JetBrains Mono',monospace;font-size:13px;background:#0b0f19;color:#ffcf5a;padding:2px 6px;border-radius:6px}
.dk a{color:#00f5d4}
.dk .photo{display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:12px;background:#1a1222;border:1px solid #ff6fae;color:#ffc2dc;font-weight:600;margin-bottom:12px}
.dk .ack{display:flex;gap:10px;align-items:flex-start;margin:4px 0 16px;padding:12px 14px;border-radius:12px;background:#0c2027;border:1px dashed #00f5d4;font-weight:600}
.dk input[type=checkbox]{width:20px;height:20px;margin-top:2px;flex:none}
.dk .btns{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.dk button{min-height:44px;padding:10px 18px;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}
.dk .go{background:#00f5d4;color:#0b0f19;border:0}.dk .go:disabled{opacity:.35;cursor:not-allowed}
.dk .cancel{background:transparent;color:#c9d4e0;border:1px solid #22304a}
`;

let acked = false;

export function ensureDockerAck(config) {
  if (acked) return Promise.resolve(true);
  const head = HEAD_PARTS.find(h => h.id === config.headId);
  const body = BODY_PARTS.find(b => b.id === config.bodyId);
  const gpuStep = config.gpuId === 'nvidia' && head?.engine !== 'cloud'
    ? '<li><b>NVIDIA GPU:</b> update your NVIDIA driver. On Windows, Docker Desktop must use the <b>WSL 2</b> backend.</li>' : '';
  const firstRun = config.sourceId === 'share'
    ? 'The first start copies the model from the conference LAN and pulls a few GB of Docker images. Give it a few minutes.'
    : head?.engine === 'cloud'
      ? 'Add your API key to the <code>.env</code> file first. The first start pulls a few GB of Docker images.'
      : 'The first start downloads the model and Docker images (several GB). Give it a while.';

  return new Promise(resolve => {
    if (!document.getElementById('dk-style')) {
      const st = document.createElement('style'); st.id = 'dk-style'; st.textContent = STYLE; document.head.appendChild(st);
    }
    const o = document.createElement('div');
    o.className = 'dk-overlay';
    o.innerHTML = `
      <div class="dk" role="dialog" aria-modal="true" aria-labelledby="dk-title">
        <h2 id="dk-title">Before you download: you need Docker</h2>
        <p>Your bot is a Docker bundle. It won't run without <b>Docker Desktop</b> (Windows / Mac) or Docker Engine (Linux) installed and running.</p>
        <div class="photo"><span aria-hidden="true">📸</span><span>Take a photo of these steps now, so you have them when you start your bot.</span></div>
        <ol>
          <li>Install Docker Desktop from <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener">docker.com/products/docker-desktop</a> and start it.</li>
          ${gpuStep}
          <li>Unzip the bundle you're about to download.</li>
          <li>Windows: double-click <code>start.bat</code>. Mac / Linux: open a terminal in the folder and run <code>bash start.sh</code>.</li>
          <li>${firstRun}</li>
          <li>Open <code>http://localhost:3000</code> to use ${body ? body.short : 'your bot'}. The README in the bundle explains connecting MCP tools.</li>
          <li>If something fails, run <code>doctor.bat</code> (or <code>bash doctor.sh</code>). It finds the problem and can ask Docker's AI assistant to fix it.</li>
        </ol>
        <label class="ack"><input type="checkbox" id="dk-check"><span>I have Docker installed (or will install it first), and I know how to start my bot.</span></label>
        <div class="btns"><button type="button" class="cancel">Cancel</button><button type="button" class="go" disabled>Download</button></div>
      </div>`;
    const check = o.querySelector('#dk-check');
    const go = o.querySelector('.go');
    const close = r => { o.remove(); document.removeEventListener('keydown', onKey); resolve(r); };
    const onKey = e => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    check.addEventListener('change', () => { go.disabled = !check.checked; });
    o.querySelector('.cancel').addEventListener('click', () => close(false));
    go.addEventListener('click', () => { acked = true; close(true); });
    document.body.appendChild(o);
    check.focus();
  });
}

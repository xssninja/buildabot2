// Acknowledgement gate: before a bundle is downloaded or emailed, the user must
// confirm where models will load from (LAN share at the conference).
import { CONFERENCE, LAN_MODE } from './conference.js';
import { HEAD_PARTS } from './botParts.js';

const STYLE = `
.lan-ack-overlay{position:fixed;inset:0;background:rgba(3,6,12,.78);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9999}
.lan-ack{max-width:560px;width:100%;background:#0f1626;border:2px solid #ffb703;border-radius:16px;padding:24px;color:#e6edf3;font-family:'Space Grotesk',system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.lan-ack h2{margin:0 0 8px;font-size:22px;color:#ffcf5a}
.lan-ack p{margin:0 0 14px;line-height:1.5;color:#c9d4e0}
.lan-ack .opt{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid #22304a;border-radius:12px;margin-bottom:10px;cursor:pointer}
.lan-ack .opt.on{border-color:#00f5d4;background:#0c2027}
.lan-ack .opt.warn.on{border-color:#ff6fae;background:#26101b}
.lan-ack .opt b{display:block}.lan-ack .opt small{color:#9fadbc}
.lan-ack .ack{display:flex;gap:10px;align-items:flex-start;margin:16px 0;padding:12px 14px;border-radius:12px;background:#14130f;border:1px dashed #ffb703;font-weight:600}
.lan-ack input[type=checkbox],.lan-ack input[type=radio]{width:20px;height:20px;margin-top:2px;flex:none}
.lan-ack .btns{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.lan-ack button{min-height:44px;padding:10px 18px;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}
.lan-ack .go{background:#00f5d4;color:#0b0f19;border:0}.lan-ack .go:disabled{opacity:.35;cursor:not-allowed}
.lan-ack .cancel{background:transparent;color:#c9d4e0;border:1px solid #22304a}
`;

let acked = null; // which source was acknowledged this page visit

export function ensureSourceAck(config) {
  const head = HEAD_PARTS.find(h => h.id === config.headId);
  if (!CONFERENCE.enabled || head?.engine === 'cloud') return Promise.resolve(config);
  if (acked && acked === config.sourceId) return Promise.resolve(config);

  return new Promise(resolve => {
    if (!document.getElementById('lan-ack-style')) {
      const st = document.createElement('style'); st.id = 'lan-ack-style'; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    let choice = config.sourceId === 'internet' ? 'internet' : 'share';
    const overlay = document.createElement('div');
    overlay.className = 'lan-ack-overlay';
    overlay.innerHTML = `
      <div class="lan-ack" role="dialog" aria-modal="true" aria-labelledby="lan-ack-title">
        <h2 id="lan-ack-title">At ${CONFERENCE.name}? Load models from the LAN.</h2>
        <p>AI models are several GB each. At ${CONFERENCE.name}, they are already on the local network share, so loading them from the LAN is much faster and keeps the conference internet usable for everyone.</p>
        <label class="opt" data-v="share"><input type="radio" name="lan-src" value="share"><span><b>Load models from the LAN (use this at ${CONFERENCE.name})</b><small>${LAN_MODE === 'url' ? `Model server: ${CONFERENCE.modelsUrl} (set in .env as MODELS_URL)` : `Share: ${CONFERENCE.modelsShare} (set in .env as MODELS_SHARE)`}</small></span></label>
        <label class="opt warn" data-v="internet"><input type="radio" name="lan-src" value="internet"><span><b>Download models from the internet</b><small>Only when you are NOT at ${CONFERENCE.name}, e.g. at home.</small></span></label>
        <label class="ack"><input type="checkbox" id="lan-ack-check"><span id="lan-ack-text"></span></label>
        <div class="btns"><button type="button" class="cancel">Cancel</button><button type="button" class="go" disabled>Continue</button></div>
      </div>`;
    const check = overlay.querySelector('#lan-ack-check');
    const go = overlay.querySelector('.go');
    const sync = () => {
      overlay.querySelectorAll('.opt').forEach(o => {
        const on = o.dataset.v === choice;
        o.classList.toggle('on', on);
        o.querySelector('input').checked = on;
      });
      overlay.querySelector('#lan-ack-text').textContent = choice === 'share'
        ? `I understand: at ${CONFERENCE.name} my bot loads its models from the LAN share, not the internet.`
        : `I understand this downloads several GB from the internet, and I am NOT using it on the ${CONFERENCE.name} network.`;
      check.checked = false;
      go.disabled = true;
    };
    overlay.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => { choice = o.dataset.v; sync(); }));
    check.addEventListener('change', () => { go.disabled = !check.checked; });
    const close = result => { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
    const onKey = e => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.cancel').addEventListener('click', () => close(null));
    go.addEventListener('click', () => {
      acked = choice;
      close({ ...config, sourceId: choice });
    });
    sync();
    document.body.appendChild(overlay);
    check.focus();
  });
}

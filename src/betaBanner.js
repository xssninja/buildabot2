// Fading "beta" banner + a permanent BETA tag next to the logo.
const STYLE = `
.beta-banner{position:fixed;top:16px;left:50%;transform:translate(-50%,-12px);z-index:9000;max-width:min(680px,calc(100vw - 32px));
  display:flex;gap:12px;align-items:center;padding:12px 16px;border-radius:12px;background:#2a1d05;border:1px solid #ffb703;
  color:#ffe2a3;font:500 14px/1.45 'Space Grotesk',system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);
  opacity:0;transition:opacity .6s ease,transform .6s ease}
.beta-banner.show{opacity:1;transform:translate(-50%,0)}
.beta-banner b{color:#ffcf5a;font-family:'JetBrains Mono',monospace;letter-spacing:1px}
.beta-banner button{flex:none;min-width:36px;min-height:36px;border-radius:8px;border:1px solid #6b5216;background:transparent;color:#ffe2a3;font-size:18px;cursor:pointer}
.beta-tag{display:inline-block;margin-left:8px;padding:2px 7px;border-radius:6px;background:#ffb703;color:#0b0f19;
  font:700 10px/1.4 'JetBrains Mono',monospace;letter-spacing:1px;vertical-align:middle}
@media (prefers-reduced-motion: reduce){.beta-banner{transition:none}}
`;

export function showBetaBanner(text, { seconds = 8 } = {}) {
  const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
  const title = document.querySelector('.brand-title');
  if (title && !title.querySelector('.beta-tag')) {
    const tag = document.createElement('span'); tag.className = 'beta-tag'; tag.textContent = 'BETA'; title.appendChild(tag);
  }
  const b = document.createElement('div');
  b.className = 'beta-banner'; b.setAttribute('role', 'status');
  const msg = document.createElement('span');
  msg.innerHTML = '<b>BETA</b> ';
  msg.append(text);
  const close = document.createElement('button');
  close.type = 'button'; close.setAttribute('aria-label', 'Dismiss beta notice'); close.textContent = '×';
  b.append(msg, close);
  document.body.appendChild(b);
  const hide = () => { b.classList.remove('show'); setTimeout(() => b.remove(), 700); };
  close.addEventListener('click', hide);
  requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('show')));
  setTimeout(hide, seconds * 1000);
}

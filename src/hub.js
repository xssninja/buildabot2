// Hub page: path cards + a working Docker Gacha
import './hub.css';
import { generateFunnyName, BODY_PARTS, FEET_PARTS, FINISH_PARTS, normalizeConfig } from './botParts.js';
import { renderBotSvg } from './botRenderer.js';
import { downloadZipBundle, encodeConfig } from './delivery.js';
import { CONFERENCE } from './conference.js';
import { ensureSourceAck } from './lanAck.js';

// Old share links pointed at "/?bot=..." – send them to the workshop
if (new URLSearchParams(location.search).has('bot')) {
  location.replace('/builder.html' + location.search);
}

// Gacha pool: lightweight images only, so the first download stays small
const GACHA = {
  headId: 'llamacpp',
  heartId: 'potato',   // Qwen3 1.7B
  gpuId: 'cpu',
  sourceId: CONFERENCE.enabled ? 'share' : 'internet',
  bodies: ['flowise', 'anythingllm'],
  feet: ['mcp-deck', 'workspace', 'chroma-tank'],
  accessories: ['rubber-duck', 'tinfoil-hat', 'ethernet-tail', 'scanline-visor']
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
let spins = 0;
let config;

function roll() {
  spins += 1;
  config = normalizeConfig({
    name: generateFunnyName(),
    headId: GACHA.headId,
    heartId: GACHA.heartId,
    gpuId: GACHA.gpuId,
    sourceId: GACHA.sourceId,
    bodyId: pick(GACHA.bodies),
    feetId: pick(GACHA.feet),
    finishId: pick(FINISH_PARTS).id,
    accessories: [pick(GACHA.accessories)]
  });
  render();
}

function render() {
  const body = BODY_PARTS.find(b => b.id === config.bodyId);
  const feet = FEET_PARTS.find(f => f.id === config.feetId);
  const capsules = [
    ['MODEL', 'Qwen3 1.7B', config.sourceId === 'share' ? 'loads from the LAN share, runs on CPU' : 'small download (~1.5 GB), runs on CPU'],
    ['ENGINE', 'llama.cpp (CPU)', 'slim image, no GPU needed'],
    ['UI', body.short, body.badge],
    ['MCP TOOL', feet.short, feet.badge]
  ];
  const box = document.getElementById('g-capsules');
  box.replaceChildren(...capsules.map(([slot, val, note]) => {
    const d = document.createElement('div');
    d.className = 'capsule spin';
    for (const [cls, txt] of [['slot', slot], ['val', val], ['note', note]]) {
      const s = document.createElement('span');
      s.className = cls; s.textContent = txt; d.appendChild(s);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.remove('spin')));
    return d;
  }));
  document.getElementById('g-spins').textContent = spins;
  const finish = FINISH_PARTS.find(f => f.id === config.finishId);
  document.getElementById('g-name').textContent = `Your bot: ${config.name} · ${finish.name} finish`;
  document.getElementById('g-bot').innerHTML = renderBotSvg(config);
  document.getElementById('g-customize').href = `/builder.html?bot=${encodeConfig(config)}`;
}

document.getElementById('g-spin').addEventListener('click', roll);
document.getElementById('g-download').addEventListener('click', async e => {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const cfg = await ensureSourceAck(config);
    if (!cfg) return;
    config = cfg; render();
    await downloadZipBundle(config);
  } finally { btn.disabled = false; }
});

roll();

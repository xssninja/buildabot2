// Build-A-Bot: The Cybernetic AI Deployment Fabricator Main Orchestrator
import './style.css';
import { HEAD_PARTS, BODY_PARTS, HEART_PARTS, FEET_PARTS, GPU_PARTS, SOURCE_PARTS, FINISH_PARTS, ACCESSORY_PARTS, generateFunnyName, normalizeConfig, estimateVram, findPart, isHeartCompatible, isHeadGpuCompatible } from './botParts.js';
import { renderBotSvg } from './botRenderer.js';
import { generateBundle } from './dockerGenerator.js';
import { downloadZipBundle, sendEmailRecipe, decodeConfig, buildShareUrl, openMailtoWithLink, shareZip } from './delivery.js';
import { glitchAssistant } from './assistant.js';
import { sound } from './sound.js';

// Application State
const state = {
  botConfig: {
    name: generateFunnyName(),
    headId: 'ollama',
    bodyId: 'openwebui',
    heartId: 'qwen3',
    feetId: 'mcp-deck',
    gpuId: 'nvidia',
    sourceId: 'internet',
    finishId: 'neon',
    accessories: ['rubber-duck']
  },
  activeFile: 'docker-compose.yml',
  compiledBundle: null
};

// Restore a build from a shared ?bot= link
(function restoreFromUrl() {
  const param = new URLSearchParams(window.location.search).get('bot');
  if (!param) return;
  const saved = decodeConfig(param);
  if (saved && typeof saved === 'object') {
    state.botConfig = normalizeConfig({
      ...state.botConfig,
      ...saved,
      accessories: Array.isArray(saved.accessories) ? saved.accessories.filter(a => ACCESSORY_PARTS.some(p => p.id === a)) : state.botConfig.accessories,
      name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.slice(0, 60) : state.botConfig.name
    });
  }
})();
state.botConfig = normalizeConfig(state.botConfig);

// UI Elements
const el = {
  botNameDisplay: document.getElementById('bot-name-display'),
  robotContainer: document.getElementById('robot-avatar-container'),
  slotsContainer: document.getElementById('slots-container'),
  slotsCount: document.getElementById('slots-count'),
  specVram: document.getElementById('spec-vram'),
  specPorts: document.getElementById('spec-ports'),
  statCuteness: document.getElementById('stat-cuteness'),
  barCuteness: document.getElementById('bar-cuteness'),
  statCtf: document.getElementById('stat-ctf'),
  barCtf: document.getElementById('bar-ctf'),
  statVram: document.getElementById('stat-vram'),
  barVram: document.getElementById('bar-vram'),
  terminalLog: document.getElementById('terminal-log'),
  mentorCommentary: document.getElementById('mentor-commentary'),
  mentorStream: document.getElementById('mentor-chat-stream'),
  mentorForm: document.getElementById('mentor-chat-form'),
  mentorInput: document.getElementById('mentor-input'),
  // Modals
  blueprintModal: document.getElementById('blueprint-modal'),
  blueprintCode: document.getElementById('blueprint-code-content'),
  blueprintTabs: document.getElementById('blueprint-tabs'),
  emailModal: document.getElementById('email-modal'),
  emailForm: document.getElementById('email-form'),
  inputUserEmail: document.getElementById('input-user-email'),
  emailStatusMsg: document.getElementById('email-status-msg'),
  settingsModal: document.getElementById('settings-modal'),
  selectByokProvider: document.getElementById('select-byok-provider'),
  inputByokKey: document.getElementById('input-byok-key'),
  toastContainer: document.getElementById('toast-container'),
  soundIcon: document.getElementById('sound-icon')
};

// Log message to virtual terminal
function appendTerminal(msg) {
  if (!el.terminalLog) return;
  const p = document.createElement('p');
  p.className = 'term-line';
  p.textContent = msg;
  el.terminalLog.appendChild(p);
  el.terminalLog.scrollTop = el.terminalLog.scrollHeight;
}

// Show toast feedback notification
function showToast(text, duration = 3500) {
  if (!el.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🤖</span> <span>${text}</span>`;
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Update Bot Stats HUD
function updateStats() {
  const head = findPart(HEAD_PARTS, state.botConfig.headId);
  const body = findPart(BODY_PARTS, state.botConfig.bodyId);
  const heart = findPart(HEART_PARTS, state.botConfig.heartId);
  const feet = findPart(FEET_PARTS, state.botConfig.feetId);

  // VRAM depends on the model AND the engine serving it
  const totalVram = estimateVram(state.botConfig);
  el.specVram.textContent = state.botConfig.gpuId === 'cpu'
    ? (head.engine === 'cloud' ? 'none (cloud)' : `~${heart.vram[head.engine] || 0} GB RAM`)
    : `~${totalVram} GB VRAM`;

  if (totalVram <= 4) {
    el.statVram.textContent = 'LOW (Runs on Potato)';
    el.barVram.style.width = '25%';
    el.barVram.className = 'progress-bar-fill fill-cyan';
  } else if (totalVram <= 10) {
    el.statVram.textContent = 'MEDIUM (Normal GPU/RAM)';
    el.barVram.style.width = '55%';
    el.barVram.className = 'progress-bar-fill fill-amber';
  } else {
    el.statVram.textContent = 'HIGH (Turbine Alert)';
    el.barVram.style.width = '90%';
    el.barVram.className = 'progress-bar-fill fill-pink';
  }

  // Combined Cuteness calculation
  const cuteness = Math.min(99, Math.round((head.cuteness + body.cuteness + heart.cuteness + feet.cuteness) / 4));
  el.statCuteness.textContent = `${cuteness}% [CRITICAL]`;
  el.barCuteness.style.width = `${cuteness}%`;

  // Combined CTF Prowess calculation
  const ctfProwess = Math.min(99, Math.round((head.ctfProwess + body.ctfProwess + heart.ctfProwess + feet.ctfProwess) / 4));
  el.statCtf.textContent = `${ctfProwess}%`;
  el.barCtf.style.width = `${ctfProwess}%`;

  // Ports display
  el.specPorts.textContent = [`:${body.defaultPort}`, head.defaultPort ? `:${head.defaultPort}` : null, `:${feet.port}`].filter(Boolean).join(', ');

  // Update Mentor Commentary Bubble
  const comment = glitchAssistant.getBuildCommentary(state.botConfig, {
    heads: HEAD_PARTS,
    bodies: BODY_PARTS,
    hearts: HEART_PARTS,
    feet: FEET_PARTS
  });
  el.mentorCommentary.textContent = `"${comment}"`;
}

// Render dynamic interactive SVG Robot
function updateRobotAvatar() {
  if (!el.robotContainer) return;
  el.robotContainer.innerHTML = renderBotSvg(state.botConfig);
}

// Why a part can't be chosen with the rest of the current build (or '' if it can)
function incompatibleReason(slotKey, part) {
  const cfg = state.botConfig;
  const head = findPart(HEAD_PARTS, cfg.headId);
  if (slotKey === 'heartId' && !isHeartCompatible(head, part)) {
    return head.engine === 'cloud' ? 'Cloud Uplink needs a cloud model' : 'Needs the Cloud Uplink head';
  }
  if (slotKey === 'headId' && !isHeadGpuCompatible(part, cfg.gpuId)) {
    return `Not supported with ${findPart(GPU_PARTS, cfg.gpuId).short}`;
  }
  if (slotKey === 'sourceId' && part.id === 'share' && head.engine === 'cloud') {
    return 'Cloud models are not downloaded';
  }
  if (slotKey === 'headId' && part.engine === 'cloud' && cfg.sourceId === 'share') {
    return 'Model Source is set to Network share';
  }
  if (slotKey === 'gpuId' && !isHeadGpuCompatible(head, part.id)) {
    return `${head.short} doesn't support this`;
  }
  return '';
}

// Build Modular Slots UI Accordion
function renderSlots() {
  const sections = [
    { key: 'headId', title: 'HEAD // BRAIN', icon: '🧠', parts: HEAD_PARTS },
    { key: 'bodyId', title: 'BODY // MISSION CONTROL', icon: '🦾', parts: BODY_PARTS },
    { key: 'heartId', title: 'HEART // POWER CORE', icon: '❤️', parts: HEART_PARTS },
    { key: 'feetId', title: 'FEET // MCP TOOLS', icon: '🦿', parts: FEET_PARTS },
    { key: 'gpuId', title: 'POWER SUPPLY // GPU', icon: '🔋', parts: GPU_PARTS },
    { key: 'sourceId', title: 'MODEL SOURCE // SUPPLY LINE', icon: '📦', parts: SOURCE_PARTS },
    { key: 'finishId', title: 'FINISH // PAINT JOB', icon: '🎨', parts: FINISH_PARTS },
    { key: 'accessories', title: 'ACCESSORIES // MODS', icon: '🎩', parts: ACCESSORY_PARTS, isMulti: true }
  ];

  el.slotsContainer.innerHTML = sections.map((sec, idx) => {
    let chosenSummary = '';
    if (sec.isMulti) {
      chosenSummary = `${state.botConfig.accessories.length} equipped`;
    } else {
      const activePart = sec.parts.find(p => p.id === state.botConfig[sec.key]);
      chosenSummary = activePart?.short || 'Selected';
    }

    const isOpen = idx === 0 ? 'active' : '';

    return `
      <div class="slot-section ${isOpen}" data-slot-key="${sec.key}">
        <div class="slot-header">
          <div class="slot-title-box">
            <span class="slot-icon">${sec.icon}</span>
            <span class="slot-name">${sec.title}</span>
          </div>
          <span class="slot-chosen-badge" id="badge-${sec.key}">${chosenSummary}</span>
        </div>
        <div class="slot-body">
          ${sec.parts.map(part => {
            const isSelected = sec.isMulti
              ? state.botConfig.accessories.includes(part.id)
              : state.botConfig[sec.key] === part.id;
            const selectedClass = isSelected ? 'selected' : '';
            const reason = incompatibleReason(sec.key, part);
            const disabledClass = reason ? 'disabled' : '';

            return `
              <div class="part-option-card ${selectedClass} ${disabledClass}" data-part-id="${part.id}" data-slot-key="${sec.key}">
                <div class="part-top-line">
                  <span class="part-name">${part.icon || '✨'} ${part.name}</span>
                  <span class="part-badge">${part.badge || part.effect || ''}</span>
                </div>
                <p class="part-desc">${part.funnyLore || part.description || ''}</p>
                ${part.technicalRole ? `<p class="part-desc" style="opacity:.75">${part.technicalRole}</p>` : ''}
                ${reason ? `<div class="part-incompat-note">⚠ ${reason}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners for Accordion Toggle & Card Selection
  el.slotsContainer.querySelectorAll('.slot-header').forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.closest('.slot-section');
      const wasActive = parent.classList.contains('active');
      el.slotsContainer.querySelectorAll('.slot-section').forEach(s => s.classList.remove('active'));
      if (!wasActive) {
        parent.classList.add('active');
        sound.playSelect();
      }
    });
  });

  el.slotsContainer.querySelectorAll('.part-option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const slotKey = card.getAttribute('data-slot-key');
      const partId = card.getAttribute('data-part-id');
      if (card.classList.contains('disabled')) {
        showToast(card.querySelector('.part-incompat-note')?.textContent || 'Not compatible with this build');
        return;
      }

      if (slotKey === 'accessories') {
        const index = state.botConfig.accessories.indexOf(partId);
        if (index > -1) {
          state.botConfig.accessories.splice(index, 1);
        } else {
          state.botConfig.accessories.push(partId);
        }
      } else {
        state.botConfig[slotKey] = partId;
        // Picking a new engine auto-swaps to a model that engine can serve
        const before = state.botConfig.heartId;
        state.botConfig = normalizeConfig(state.botConfig);
        if (before !== state.botConfig.heartId) {
          const h = findPart(HEART_PARTS, state.botConfig.heartId);
          showToast(`Heart swapped to ${h.short} to match the new engine`);
        }
      }

      sound.playSelect();
      updateRobotAvatar();
      updateStats();
      renderSlots();

      const partName = card.querySelector('.part-name')?.textContent || partId;
      appendTerminal(`> Equipped ${partName} to slot [${slotKey}]`);
    });
  });
}

// Refresh Blueprint modal view
function refreshBlueprintModal() {
  state.compiledBundle = generateBundle(state.botConfig);
  const activeContent = state.compiledBundle.files[state.activeFile] || '';
  el.blueprintCode.textContent = activeContent;

  el.blueprintTabs.querySelectorAll('.bp-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-file') === state.activeFile);
  });
}

// Initial Wire-Up
function init() {
  // Initial Render
  el.botNameDisplay.textContent = state.botConfig.name;
  renderSlots();
  updateRobotAvatar();
  updateStats();
  appendTerminal(`> Fabricator bay initialized. Designating "${state.botConfig.name}"`);

  // Audio mute button state
  if (sound.isMuted()) {
    el.soundIcon.textContent = '🔇 Sound OFF';
  }

  // --- Event Handlers ---

  // Bot avatar purr interaction
  el.robotContainer.addEventListener('click', () => {
    sound.playPurr();
    appendTerminal(`> Bot purrs softly. System temperature normal.`);
    showToast('✨ *Purr* System operational!');
  });

  document.getElementById('btn-sound-purr')?.addEventListener('click', () => {
    sound.playPurr();
    showToast('✨ *Purr* Operative companion online!');
  });

  // Re-roll funny hacker name
  document.getElementById('btn-reroll-name').addEventListener('click', () => {
    state.botConfig.name = generateFunnyName();
    el.botNameDisplay.textContent = state.botConfig.name;
    sound.playReroll();
    appendTerminal(`> Identity randomized: "${state.botConfig.name}"`);
    showToast(`🎲 New Identity: ${state.botConfig.name}`);
  });

  // Edit name manually
  document.getElementById('btn-edit-name').addEventListener('click', () => {
    const custom = prompt('Enter custom operative designation:', state.botConfig.name);
    if (custom && custom.trim()) {
      state.botConfig.name = custom.trim();
      el.botNameDisplay.textContent = state.botConfig.name;
      sound.playSelect();
      appendTerminal(`> Renamed operative to "${state.botConfig.name}"`);
    }
  });

  // Sound toggle
  document.getElementById('btn-toggle-sound').addEventListener('click', () => {
    const muted = sound.toggleMute();
    el.soundIcon.textContent = muted ? '🔇 Sound OFF' : '🔊 Sound ON';
    if (!muted) sound.playSelect();
    showToast(muted ? 'Audio muted' : 'Audio enabled');
  });

  // Settings Modal
  document.getElementById('btn-open-settings').addEventListener('click', () => {
    const keyInfo = glitchAssistant.getCustomKeyInfo();
    el.selectByokProvider.value = keyInfo.provider || 'gemini';
    el.inputByokKey.value = keyInfo.hasCustomKey ? '••••••••••••••••' : '';
    el.settingsModal.classList.add('active');
    sound.playSelect();
  });

  document.getElementById('btn-close-settings').addEventListener('click', () => {
    el.settingsModal.classList.remove('active');
  });

  document.getElementById('btn-save-byok').addEventListener('click', () => {
    const provider = el.selectByokProvider.value;
    const key = el.inputByokKey.value.trim();
    if (key && !key.startsWith('•••')) {
      glitchAssistant.setCustomKey(provider, key);
      showToast('API Key saved locally in browser storage!');
    }
    el.settingsModal.classList.remove('active');
    sound.playSelect();
  });

  // Blueprint Compile Modal
  document.getElementById('btn-compile-modal').addEventListener('click', () => {
    sound.playSuccess();
    appendTerminal(`> Compiling Docker stack for "${state.botConfig.name}"... OK!`);
    refreshBlueprintModal();
    el.blueprintModal.classList.add('active');
  });

  document.getElementById('btn-close-blueprint').addEventListener('click', () => {
    el.blueprintModal.classList.remove('active');
  });

  // Blueprint Tabs
  el.blueprintTabs.querySelectorAll('.bp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeFile = tab.getAttribute('data-file');
      sound.playSelect();
      refreshBlueprintModal();
    });
  });

  // Copy code button
  document.getElementById('btn-copy-code').addEventListener('click', async () => {
    const content = el.blueprintCode.textContent;
    try {
      await navigator.clipboard.writeText(content);
      sound.playSelect();
      showToast(`📋 Copied ${state.activeFile} to clipboard!`);
    } catch {
      showToast('Copy failed. Select and copy manually.');
    }
  });

  // Download .zip from modal or action deck
  const handleZipDownload = async () => {
    sound.playSuccess();
    appendTerminal(`> Packaging ${state.botConfig.name} into .zip archive...`);
    showToast('📦 Bundling Docker files...');
    try {
      const res = await downloadZipBundle(state.botConfig);
      appendTerminal(`> Archive ${res.fileName} dispatched to browser download!`);
      showToast(`✅ Downloaded ${res.fileName}!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Packaging error. Check browser console.');
    }
  };

  document.getElementById('btn-direct-download').addEventListener('click', handleZipDownload);
  document.getElementById('btn-modal-download-zip').addEventListener('click', handleZipDownload);
  document.getElementById('btn-email-fallback-zip').addEventListener('click', () => {
    el.emailModal.classList.remove('active');
    handleZipDownload();
  });

  // Email Modal
  document.getElementById('btn-email-modal').addEventListener('click', () => {
    el.emailStatusMsg.textContent = '';
    el.emailModal.classList.add('active');
    sound.playSelect();
  });

  document.getElementById('btn-close-email').addEventListener('click', () => {
    el.emailModal.classList.remove('active');
  });

  // Email Submission
  el.emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el.inputUserEmail.value.trim();
    if (!email) return;

    sound.playSelect();
    el.emailStatusMsg.textContent = 'Encrypting & streaming package...';
    appendTerminal(`> Dispatching package to ${email} via ephemeral stream...`);

    const result = await sendEmailRecipe(email, state.botConfig);
    if (result.success) {
      sound.playSuccess();
      el.emailStatusMsg.innerHTML = `<span class="neon-green">✔ ${escapeHtml(result.message)}</span>`;
      appendTerminal(`> Delivery confirmed. Nothing stored server-side.`);
      showToast('🚀 Email sent!');
    } else if (result.notConfigured) {
      el.emailStatusMsg.innerHTML = `<span class="neon-amber">${escapeHtml(result.message)} Use "Use my mail app" or "Share .zip" below instead.</span>`;
    } else {
      el.emailStatusMsg.innerHTML = `<span class="neon-pink">✖ ${escapeHtml(result.message)}</span>`;
    }
  });

  document.getElementById('btn-email-mailto').addEventListener('click', () => {
    openMailtoWithLink(el.inputUserEmail.value.trim(), state.botConfig);
  });

  document.getElementById('btn-email-share').addEventListener('click', async () => {
    try {
      const ok = await shareZip(state.botConfig);
      if (!ok) showToast('Sharing files is not supported in this browser. Use Download instead.');
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Share cancelled or failed.');
    }
  });

  document.getElementById('btn-copy-share-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(state.botConfig));
      showToast('🔗 Rebuild link copied!');
    } catch {
      showToast('Copy failed.');
    }
  });

  // GL1TCH-E Chat Form
  el.mentorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = el.mentorInput.value.trim();
    if (!query) return;

    el.mentorInput.value = '';
    sound.playSelect();

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg msg-user';
    userMsg.innerHTML = `<span class="msg-sender">OPERATIVE:</span><span class="msg-text">${escapeHtml(query)}</span>`;
    el.mentorStream.appendChild(userMsg);
    el.mentorStream.scrollTop = el.mentorStream.scrollHeight;

    // Loading indicator
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg msg-bot';
    botMsg.innerHTML = `<span class="msg-sender">GL1TCH-E:</span><span class="msg-text"><em>*thinking...*</em></span>`;
    el.mentorStream.appendChild(botMsg);
    el.mentorStream.scrollTop = el.mentorStream.scrollHeight;

    appendTerminal(`> Query sent to GL1TCH-E: "${query}"`);

    // Get assistant reply
    const reply = await glitchAssistant.sendMessage(query, state.botConfig, {
      heads: HEAD_PARTS,
      bodies: BODY_PARTS,
      hearts: HEART_PARTS,
      feet: FEET_PARTS
    });

    botMsg.querySelector('.msg-text').textContent = reply;
    el.mentorStream.scrollTop = el.mentorStream.scrollHeight;
    sound.playPurr();
    appendTerminal(`> GL1TCH-E response received.`);
  });

  // Quick Chat Suggestion Chips
  document.querySelectorAll('.chip-query').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      el.mentorInput.value = q;
      el.mentorForm.dispatchEvent(new Event('submit'));
    });
  });

  // Close modals on clicking outside
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Start Application
window.addEventListener('DOMContentLoaded', init);

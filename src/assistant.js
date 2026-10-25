// GL1TCH-E: Master Botwright AI Chat Assistant & Workshop Mentor
// Securely proxies to serverless /api/chat (protecting keys) with intelligent local fallback

export class GlitchAssistant {
  constructor() {
    this.history = [];
    const hasStorage = typeof localStorage !== 'undefined';
    this.byokKey = hasStorage ? (localStorage.getItem('buildabot_custom_key') || '') : '';
    this.byokProvider = hasStorage ? (localStorage.getItem('buildabot_custom_provider') || 'gemini') : 'gemini';
  }

  setCustomKey(provider, key) {
    this.byokProvider = provider;
    this.byokKey = key;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('buildabot_custom_key', key);
      localStorage.setItem('buildabot_custom_provider', provider);
    }
  }

  getCustomKeyInfo() {
    return {
      hasCustomKey: Boolean(this.byokKey),
      provider: this.byokProvider
    };
  }

  // Generate dynamic contextual commentary based on currently selected parts
  getBuildCommentary(config, parts) {
    const head = parts.heads.find(h => h.id === config.headId);
    const body = parts.bodies.find(b => b.id === config.bodyId);
    const heart = parts.hearts.find(h => h.id === config.heartId);
    const feet = parts.feet.find(f => f.id === config.feetId);

    if (config.headId === 'vllm' && config.heartId === 'potato') {
      return `*snickers* Pairing high-RPM vLLM with a 1.7B potato model? That's like putting a Pratt & Whitney jet engine onto a toddler's tricycle! But hey, it'll run at 400 tokens/sec!`;
    }

    if (config.feetId === 'browser-use' && config.heartId === 'qwen3') {
      return `Purr-fect combo! Qwen3's reasoning paired with Browser-Use will tear through web challenges. It'll find hidden DOM flags before breakfast!`;
    }

    if (config.feetId === 'mcp-deck') {
      return `Aha, Model Context Protocol cyber-deck equipped! Your bot will speak native MCP JSON-RPC to the included Quantum Vault server on port 9090. L33t choice!`;
    }

    if (config.bodyId === 'n8n') {
      return `n8n pincer engaged! Add an MCP Client Tool node for each server in your README and let the workflows fly.`;
    }

    return `Config looks crisp! Current hardware footprint: ~${heart?.vram?.[head?.engine] ?? 4} GB. Let me know if you need CTF tactics or Docker tuning!`;
  }

  async sendMessage(userMessage, currentConfig, partsCatalog) {
    // Save to history
    this.history.push({ role: 'user', content: userMessage });

    const head = partsCatalog.heads.find(h => h.id === currentConfig.headId)?.name;
    const body = partsCatalog.bodies.find(b => b.id === currentConfig.bodyId)?.name;
    const heart = partsCatalog.hearts.find(h => h.id === currentConfig.heartId)?.name;
    const feet = partsCatalog.feet.find(f => f.id === currentConfig.feetId)?.name;

    const botContext = `User is assembling an AI bot named "${currentConfig.name}": Head: ${head}, Body: ${body}, Heart: ${heart}, Feet: ${feet}.`;

    // 1. Try secure Serverless Proxy (/api/chat)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: botContext,
          history: this.history.slice(-6),
          byokKey: this.byokKey,
          byokProvider: this.byokProvider
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          this.history.push({ role: 'assistant', content: data.reply });
          return data.reply;
        }
      }
    } catch {
      // Fall through to heuristic mode when running offline or in preview without server
    }

    // 2. Intelligent Local Heuristic Assistant (Offline / Local Dev Fallback)
    const reply = this.getLocalHeuristicReply(userMessage, currentConfig);
    this.history.push({ role: 'assistant', content: reply });
    return reply;
  }

  getLocalHeuristicReply(message, config) {
    const lower = message.toLowerCase();

    if (lower.includes('docker') || lower.includes('build') || lower.includes('run')) {
      return `To launch your assembled bot, just unzip your downloaded package and run:\n\`\`\`bash\ndocker compose up -d\n\`\`\`\nThis builds your local CTF web target (port 8088), the challenge MCP server (port 9090), and starts your AI orchestrator! You can inspect logs anytime with \`docker compose logs -f\`.`;
    }

    if (lower.includes('mcp') || lower.includes('protocol') || lower.includes('tool')) {
      return `The Model Context Protocol (MCP) lets your bot execute standardized tools outside its sandbox! In your bundle, Challenge 2 is a preconfigured MCP server on port 9090. Your agent can call \`inspect_firmware()\` and \`decrypt_firmware()\` to extract \`FLAG{WH1T3_H4T_B0T_4SS3MBL3D}\`.`;
    }

    if (lower.includes('vram') || lower.includes('ram') || lower.includes('gpu') || lower.includes('hardware')) {
      return `Hardware check: For your current build, you'll need around 4-8 GB of RAM/VRAM. If you don't have an Nvidia GPU, don't sweat it! The Docker compose file automatically falls back to CPU quantization mode smoothly.`;
    }

    if (lower.includes('ctf') || lower.includes('flag') || lower.includes('challenge') || lower.includes('hack')) {
      return `Two White-Hat challenges are baked into your bundle:\n1. **The Hidden Beacon (Port 8088)**: Have your agent inspect HTML source comments and HTTP headers for the hidden vault key!\n2. **The Quantum Vault MCP (Port 9090)**: Query the MCP server with the cipher mode 'quantum_bypass' to crack the firmware!`;
    }

    if (lower.includes('name') || lower.includes('rename')) {
      return `Hit that 🎲 "Re-Roll Identity" button up top! My algorithm has generated over 1,000 top-tier hacker aliases like *Sir Pwns-A-Lot 3000* and *BufferOverFluff*.`;
    }

    return `*beeps enthusiastically* Roger that, Operative! Your build is looking dangerously cute. What would you like to tweak next: the LLM inference brain, the agent UI, the MCP tooling, or shall we compile the Docker package?`;
  }
}

export const glitchAssistant = new GlitchAssistant();

// Interactive SVG Cyber-Bot Visualizer Engine
// Generates a dynamic, animated, scalable cybernetic robot mascot reflecting custom parts

export function renderBotSvg(config) {
  const { headId, bodyId, heartId, feetId, accessories = [] } = config;

  // Visual Palette
  const neonCyan = '#00f5d4';
  const neonPink = '#ff007f';
  const neonAmber = '#ffb703';
  const neonGreen = '#39ff14';
  const neonPurple = '#7b2cbf';
  const darkMetal = '#111827';
  const lightMetal = '#1f2937';
  const highlightMetal = '#374151';

  // Heart color & symbol
  let heartColor = neonCyan;
  let heartSymbol = '⚡';
  let heartGlow = 'rgba(0, 245, 212, 0.6)';

  if (heartId === 'qwen3') {
    heartColor = neonCyan;
    heartSymbol = '01';
    heartGlow = 'rgba(0, 245, 212, 0.8)';
  } else if (heartId === 'llama31') {
    heartColor = '#3b82f6';
    heartSymbol = '🦙';
    heartGlow = 'rgba(59, 130, 246, 0.8)';
  } else if (heartId === 'gptoss') {
    heartColor = neonGreen;
    heartSymbol = '🛡️';
    heartGlow = 'rgba(57, 255, 20, 0.8)';
  } else if (heartId === 'potato') {
    heartColor = neonAmber;
    heartSymbol = '🔋';
    heartGlow = 'rgba(255, 183, 3, 0.8)';
  } else if (String(heartId).startsWith('cloud')) {
    heartColor = neonPurple;
    heartSymbol = '🌌';
    heartGlow = 'rgba(123, 44, 191, 0.8)';
  }

  // Feet Graphics
  let feetSvg = '';
  if (feetId === 'mcp-deck') {
    // Heavy Tank Treads
    feetSvg = `
      <g id="feet-treads" class="part-group">
        <!-- Left Tread -->
        <g transform="translate(60, 290)">
          <rect x="0" y="0" width="75" height="42" rx="12" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2" />
          <circle cx="15" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <circle cx="37" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <circle cx="60" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <line x1="2" y1="21" x2="73" y2="21" stroke="${neonCyan}" stroke-dasharray="4 3" stroke-width="2" />
        </g>
        <!-- Right Tread -->
        <g transform="translate(185, 290)">
          <rect x="0" y="0" width="75" height="42" rx="12" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2" />
          <circle cx="15" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <circle cx="37" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <circle cx="60" cy="21" r="11" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" class="anim-spin" />
          <line x1="2" y1="21" x2="73" y2="21" stroke="${neonCyan}" stroke-dasharray="4 3" stroke-width="2" />
        </g>
      </g>
    `;
  } else if (feetId === 'browser-use') {
    // Multi-Jointed Cyber Crawler Legs / Thruster Boots
    feetSvg = `
      <g id="feet-crawler" class="part-group">
        <!-- Thruster flames -->
        <ellipse cx="98" cy="328" rx="16" ry="7" fill="${neonPink}" opacity="0.8" class="anim-pulse" />
        <ellipse cx="222" cy="328" rx="16" ry="7" fill="${neonPink}" opacity="0.8" class="anim-pulse" />
        <!-- Hover Boots -->
        <path d="M75,285 L120,285 L115,318 L80,318 Z" fill="${darkMetal}" stroke="${neonPink}" stroke-width="2" />
        <path d="M200,285 L245,285 L240,318 L205,318 Z" fill="${darkMetal}" stroke="${neonPink}" stroke-width="2" />
        <!-- Glowing energy nozzles -->
        <rect x="83" y="315" width="28" height="6" rx="2" fill="${neonPink}" />
        <rect x="208" y="315" width="28" height="6" rx="2" fill="${neonPink}" />
      </g>
    `;
  } else if (feetId === 'workspace') {
    // Bipedal Ninja Combat Springs
    feetSvg = `
      <g id="feet-ninja" class="part-group">
        <!-- Left Leg -->
        <line x1="100" y1="280" x2="95" y2="305" stroke="${neonGreen}" stroke-width="6" stroke-linecap="round" />
        <path d="M75,305 L115,305 L120,325 L70,325 Z" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2" />
        <circle cx="95" cy="315" r="4" fill="${neonGreen}" />
        <!-- Right Leg -->
        <line x1="220" y1="280" x2="225" y2="305" stroke="${neonGreen}" stroke-width="6" stroke-linecap="round" />
        <path d="M205,305 L245,305 L250,325 L200,325 Z" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2" />
        <circle cx="225" cy="315" r="4" fill="${neonGreen}" />
      </g>
    `;
  } else {
    // Mag-Lev Anti-Gravity Base
    feetSvg = `
      <g id="feet-maglev" class="part-group">
        <ellipse cx="160" cy="320" rx="70" ry="14" fill="${neonPurple}" opacity="0.3" class="anim-pulse" />
        <path d="M100,285 Q160,305 220,285 L205,305 Q160,320 115,305 Z" fill="${darkMetal}" stroke="${neonPurple}" stroke-width="2" />
        <circle cx="125" cy="298" r="6" fill="${neonPurple}" class="anim-pulse" />
        <circle cx="160" cy="303" r="7" fill="${neonCyan}" class="anim-pulse" />
        <circle cx="195" cy="298" r="6" fill="${neonPurple}" class="anim-pulse" />
      </g>
    `;
  }

  // Body Graphics
  let bodySvg = '';
  if (bodyId === 'n8n') {
    // Tactical Armored Mech with Pincer Claws
    bodySvg = `
      <g id="body-openclaw" class="part-group">
        <!-- Left Claw -->
        <g class="anim-claw-left">
          <line x1="85" y1="180" x2="45" y2="210" stroke="${highlightMetal}" stroke-width="8" stroke-linecap="round" />
          <path d="M45,210 Q25,200 35,185 M45,210 Q20,225 35,235" fill="none" stroke="${neonPink}" stroke-width="4" stroke-linecap="round" />
        </g>
        <!-- Right Claw -->
        <g class="anim-claw-right">
          <line x1="235" y1="180" x2="275" y2="210" stroke="${highlightMetal}" stroke-width="8" stroke-linecap="round" />
          <path d="M275,210 Q295,200 285,185 M275,210 Q300,225 285,235" fill="none" stroke="${neonPink}" stroke-width="4" stroke-linecap="round" />
        </g>
        <!-- Main Torso Chassis -->
        <rect x="85" y="160" width="150" height="125" rx="18" fill="${darkMetal}" stroke="${neonPink}" stroke-width="2" />
        <path d="M100,165 L220,165 L210,185 L110,185 Z" fill="${highlightMetal}" opacity="0.6" />
        <!-- Armor Rivets -->
        <circle cx="95" cy="172" r="3" fill="${neonPink}" />
        <circle cx="225" cy="172" r="3" fill="${neonPink}" />
        <circle cx="95" cy="273" r="3" fill="${neonPink}" />
        <circle cx="225" cy="273" r="3" fill="${neonPink}" />
      </g>
    `;
  } else if (bodyId === 'flowise') {
    // Glass Node Circuit Chassis
    bodySvg = `
      <g id="body-flowise" class="part-group">
        <!-- Transparent Glass Chassis -->
        <rect x="85" y="160" width="150" height="125" rx="16" fill="rgba(17, 24, 39, 0.85)" stroke="${neonAmber}" stroke-width="2" />
        <!-- Glowing Noodle Circuit Wires -->
        <path d="M105,185 C130,220 120,240 140,265" fill="none" stroke="${neonCyan}" stroke-width="2.5" stroke-dasharray="4 2" />
        <path d="M215,185 C190,215 200,235 180,265" fill="none" stroke="${neonPink}" stroke-width="2.5" stroke-dasharray="4 2" />
        <!-- Node plugs -->
        <circle cx="105" cy="185" r="4" fill="${neonCyan}" />
        <circle cx="215" cy="185" r="4" fill="${neonPink}" />
        <circle cx="140" cy="265" r="4" fill="${neonCyan}" />
        <circle cx="180" cy="265" r="4" fill="${neonPink}" />
        <!-- Left & Right Hands -->
        <rect x="58" y="195" width="26" height="50" rx="8" fill="${lightMetal}" stroke="${neonAmber}" stroke-width="1.5" />
        <rect x="236" y="195" width="26" height="50" rx="8" fill="${lightMetal}" stroke="${neonAmber}" stroke-width="1.5" />
      </g>
    `;
  } else if (bodyId === 'autogen') {
    // Multi-Agent Swarm Rig
    bodySvg = `
      <g id="body-autogen" class="part-group">
        <!-- Orbiting Mini-Drones -->
        <g class="anim-float-left">
          <circle cx="48" cy="165" r="14" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2" />
          <circle cx="48" cy="165" r="5" fill="${neonGreen}" />
          <line x1="48" y1="151" x2="48" y2="145" stroke="${neonGreen}" stroke-width="2" />
        </g>
        <g class="anim-float-right">
          <circle cx="272" cy="165" r="14" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2" />
          <circle cx="272" cy="165" r="5" fill="${neonGreen}" />
          <line x1="272" y1="151" x2="272" y2="145" stroke="${neonGreen}" stroke-width="2" />
        </g>
        <!-- Heavy Swarm Core Torso -->
        <rect x="85" y="160" width="150" height="125" rx="16" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2" />
        <rect x="95" y="248" width="130" height="25" rx="6" fill="${lightMetal}" />
        <!-- LED indicator rack -->
        <circle cx="110" cy="260" r="3.5" fill="${neonGreen}" class="anim-pulse" />
        <circle cx="125" cy="260" r="3.5" fill="${neonCyan}" class="anim-pulse" />
        <circle cx="140" cy="260" r="3.5" fill="${neonAmber}" class="anim-pulse" />
        <circle cx="155" cy="260" r="3.5" fill="${neonPink}" class="anim-pulse" />
        <text x="175" y="264" fill="#9ca3af" font-family="monospace" font-size="10">SWARM:4</text>
      </g>
    `;
  } else if (bodyId === 'anythingllm') {
    // Reinforced Safe-Chest
    bodySvg = `
      <g id="body-anythingllm" class="part-group">
        <rect x="85" y="160" width="150" height="125" rx="12" fill="${darkMetal}" stroke="${neonAmber}" stroke-width="2.5" />
        <!-- Safe combination dial rim -->
        <circle cx="160" cy="225" r="38" fill="${lightMetal}" stroke="${neonAmber}" stroke-width="2" />
        <circle cx="160" cy="225" r="28" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="1.5" />
        <!-- Side arms -->
        <rect x="58" y="185" width="26" height="60" rx="8" fill="${lightMetal}" stroke="${neonAmber}" stroke-width="1.5" />
        <rect x="236" y="185" width="26" height="60" rx="8" fill="${lightMetal}" stroke="${neonAmber}" stroke-width="1.5" />
      </g>
    `;
  } else {
    // Default: Open WebUI Polished Bunker Torso
    bodySvg = `
      <g id="body-openwebui" class="part-group">
        <!-- Arms -->
        <rect x="56" y="180" width="28" height="65" rx="10" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" />
        <rect x="236" y="180" width="28" height="65" rx="10" fill="${lightMetal}" stroke="${neonCyan}" stroke-width="1.5" />
        <circle cx="70" cy="235" r="5" fill="${neonCyan}" />
        <circle cx="250" cy="235" r="5" fill="${neonCyan}" />
        <!-- Main Chassis -->
        <rect x="85" y="160" width="150" height="125" rx="20" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2.5" />
        <path d="M100,175 Q160,185 220,175" stroke="${highlightMetal}" stroke-width="3" fill="none" />
        <!-- Status Equalizer Audio Bars -->
        <g transform="translate(100, 252)">
          <rect x="0" y="4" width="4" height="12" fill="${neonCyan}" rx="2" class="anim-pulse" />
          <rect x="8" y="0" width="4" height="16" fill="${neonCyan}" rx="2" class="anim-pulse" />
          <rect x="16" y="6" width="4" height="10" fill="${neonCyan}" rx="2" class="anim-pulse" />
          <rect x="24" y="2" width="4" height="14" fill="${neonCyan}" rx="2" class="anim-pulse" />
        </g>
        <text x="142" y="264" fill="${neonCyan}" font-family="monospace" font-weight="bold" font-size="10">ONLINE</text>
      </g>
    `;
  }

  // Heart Component (Sits centrally inside the body)
  const heartSvg = `
    <g id="heart-reactor" transform="translate(160, 215)" class="anim-heart-beat">
      <!-- Outer containment chamber -->
      <circle cx="0" cy="0" r="26" fill="rgba(17, 24, 39, 0.95)" stroke="${heartColor}" stroke-width="2.5" />
      <!-- Pulsing Glow Ring -->
      <circle cx="0" cy="0" r="21" fill="none" stroke="${heartColor}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8" class="anim-spin" />
      <!-- Reactor Core -->
      <circle cx="0" cy="0" r="14" fill="${heartColor}" opacity="0.3" filter="drop-shadow(0 0 8px ${heartGlow})" />
      <text x="0" y="5" fill="${heartColor}" font-size="14" font-weight="bold" text-anchor="middle" font-family="sans-serif">${heartSymbol}</text>
    </g>
  `;

  // Head Graphics
  let headSvg = '';
  if (headId === 'vllm') {
    // High-RPM Aerodynamic Head with Twin Turbines
    headSvg = `
      <g id="head-vllm" class="part-group">
        <!-- Neck -->
        <rect x="145" y="145" width="30" height="18" fill="${highlightMetal}" />
        <!-- Left Turbine Fan -->
        <g transform="translate(68, 80)">
          <circle cx="15" cy="25" r="20" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2" />
          <line x1="5" y1="25" x2="25" y2="25" stroke="${neonCyan}" stroke-width="2" class="anim-spin" />
          <line x1="15" y1="15" x2="15" y2="35" stroke="${neonCyan}" stroke-width="2" class="anim-spin" />
        </g>
        <!-- Right Turbine Fan -->
        <g transform="translate(222, 80)">
          <circle cx="15" cy="25" r="20" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2" />
          <line x1="5" y1="25" x2="25" y2="25" stroke="${neonCyan}" stroke-width="2" class="anim-spin" />
          <line x1="15" y1="15" x2="15" y2="35" stroke="${neonCyan}" stroke-width="2" class="anim-spin" />
        </g>
        <!-- Main Helmet Box -->
        <rect x="95" y="55" width="130" height="95" rx="16" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2.5" />
        <!-- High-tech Sleek Visor Eye -->
        <rect x="108" y="82" width="104" height="28" rx="8" fill="#030712" stroke="${neonCyan}" stroke-width="1.5" />
        <line x1="114" y1="96" x2="206" y2="96" stroke="${neonCyan}" stroke-width="4" stroke-linecap="round" class="anim-pulse" />
        <text x="160" y="132" fill="${neonCyan}" font-family="monospace" font-size="9" text-anchor="middle">PAGED_ATTN // VLLM</text>
      </g>
    `;
  } else if (headId === 'llamacpp') {
    // Aristocrat Robot with Monocle HUD
    headSvg = `
      <g id="head-lmstudio" class="part-group">
        <!-- Neck -->
        <rect x="145" y="145" width="30" height="18" fill="${highlightMetal}" />
        <!-- Head Chassis -->
        <rect x="95" y="55" width="130" height="95" rx="18" fill="${darkMetal}" stroke="${neonAmber}" stroke-width="2.5" />
        <!-- Left Eye (Normal) -->
        <circle cx="130" cy="95" r="9" fill="${neonAmber}" class="anim-blink" />
        <!-- Right Eye with Monocle HUD -->
        <circle cx="190" cy="95" r="16" fill="none" stroke="${neonCyan}" stroke-width="2.5" />
        <circle cx="190" cy="95" r="8" fill="${neonCyan}" class="anim-pulse" />
        <line x1="206" y1="95" x2="225" y2="120" stroke="${neonCyan}" stroke-width="1.5" />
        <!-- Mustache / Grill -->
        <path d="M140,126 Q160,118 180,126" stroke="${neonAmber}" stroke-width="2.5" fill="none" stroke-linecap="round" />
      </g>
    `;
  } else if (headId === 'localai') {
    // Multi-Modal Dome with Triple Sensors
    headSvg = `
      <g id="head-localai" class="part-group">
        <!-- Neck -->
        <rect x="145" y="145" width="30" height="18" fill="${highlightMetal}" />
        <!-- Head Dome -->
        <rect x="95" y="55" width="130" height="95" rx="28" fill="${darkMetal}" stroke="${neonGreen}" stroke-width="2.5" />
        <!-- Triple Optical Sensors -->
        <circle cx="130" cy="85" r="11" fill="#052e16" stroke="${neonGreen}" stroke-width="2" />
        <circle cx="130" cy="85" r="5" fill="${neonGreen}" class="anim-pulse" />
        <circle cx="190" cy="85" r="11" fill="#052e16" stroke="${neonGreen}" stroke-width="2" />
        <circle cx="190" cy="85" r="5" fill="${neonGreen}" class="anim-pulse" />
        <circle cx="160" cy="72" r="8" fill="#052e16" stroke="${neonCyan}" stroke-width="1.5" />
        <circle cx="160" cy="72" r="3.5" fill="${neonCyan}" />
        <!-- Audio Spectrum Mouth -->
        <line x1="135" y1="125" x2="185" y2="125" stroke="${neonGreen}" stroke-width="3" stroke-dasharray="4 2" />
      </g>
    `;
  } else if (headId === 'cloud') {
    // Creative Multi-Modal Head with Paintbrush Antennas
    headSvg = `
      <g id="head-comfyui" class="part-group">
        <!-- Neck -->
        <rect x="145" y="145" width="30" height="18" fill="${highlightMetal}" />
        <!-- Glowing Antennas -->
        <line x1="125" y1="55" x2="110" y2="30" stroke="${neonPink}" stroke-width="3" stroke-linecap="round" />
        <circle cx="110" cy="30" r="5" fill="${neonPink}" class="anim-pulse" />
        <line x1="195" y1="55" x2="210" y2="30" stroke="${neonPurple}" stroke-width="3" stroke-linecap="round" />
        <circle cx="210" cy="30" r="5" fill="${neonPurple}" class="anim-pulse" />
        <!-- Head Box -->
        <rect x="95" y="55" width="130" height="95" rx="20" fill="${darkMetal}" stroke="${neonPink}" stroke-width="2.5" />
        <!-- Colorful Dual Screens -->
        <circle cx="135" cy="95" r="14" fill="#030712" stroke="${neonPink}" stroke-width="2" />
        <text x="135" y="100" fill="${neonPink}" font-size="12" text-anchor="middle">🎨</text>
        <circle cx="185" cy="95" r="14" fill="#030712" stroke="${neonPurple}" stroke-width="2" />
        <text x="185" y="100" fill="${neonCyan}" font-size="12" text-anchor="middle">✨</text>
        <!-- Smile -->
        <path d="M145,125 Q160,136 175,125" stroke="${neonPink}" stroke-width="2.5" fill="none" stroke-linecap="round" />
      </g>
    `;
  } else {
    // Default: Ollama CRT Monitor with Kawaii Cat Ears
    headSvg = `
      <g id="head-ollama" class="part-group">
        <!-- Neck -->
        <rect x="145" y="145" width="30" height="18" fill="${highlightMetal}" />
        <!-- Cat Ear Left -->
        <polygon points="105,58 128,24 140,58" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2.5" />
        <polygon points="112,56 128,32 136,56" fill="${neonPink}" opacity="0.8" />
        <!-- Cat Ear Right -->
        <polygon points="180,58 192,24 215,58" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2.5" />
        <polygon points="184,56 192,32 208,56" fill="${neonPink}" opacity="0.8" />
        <!-- Antenna -->
        <line x1="225" y1="65" x2="242" y2="40" stroke="${neonCyan}" stroke-width="2" />
        <circle cx="242" cy="40" r="4" fill="${neonCyan}" class="anim-pulse" />
        <!-- CRT Monitor Shell -->
        <rect x="95" y="55" width="130" height="95" rx="18" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="2.5" />
        <!-- Inner CRT Screen -->
        <rect x="106" y="66" width="108" height="73" rx="10" fill="#030712" stroke="${highlightMetal}" stroke-width="1.5" />
        <!-- Kawaii Blinking Eyes & Mouth -->
        <g class="anim-blink">
          <!-- Left Eye (^ shape) -->
          <path d="M124,96 L134,88 L144,96" fill="none" stroke="${neonCyan}" stroke-width="3" stroke-linecap="round" />
          <!-- Right Eye (^ shape) -->
          <path d="M176,96 L186,88 L196,96" fill="none" stroke="${neonCyan}" stroke-width="3" stroke-linecap="round" />
          <!-- W cute mouth -->
          <path d="M152,110 Q156,116 160,111 Q164,116 168,110" fill="none" stroke="${neonCyan}" stroke-width="2.5" stroke-linecap="round" />
        </g>
        <!-- CRT scanline overlay -->
        <line x1="107" y1="78" x2="213" y2="78" stroke="${neonCyan}" stroke-opacity="0.25" stroke-width="1" />
        <line x1="107" y1="92" x2="213" y2="92" stroke="${neonCyan}" stroke-opacity="0.25" stroke-width="1" />
        <line x1="107" y1="106" x2="213" y2="106" stroke="${neonCyan}" stroke-opacity="0.25" stroke-width="1" />
        <line x1="107" y1="120" x2="213" y2="120" stroke="${neonCyan}" stroke-opacity="0.25" stroke-width="1" />
      </g>
    `;
  }

  // Accessories
  let accSvg = '';
  if (accessories.includes('tinfoil-hat')) {
    accSvg += `
      <!-- Tinfoil Bucket Hat -->
      <g id="acc-tinfoil" transform="translate(160, 48)">
        <polygon points="-42,10 42,10 26,-20 -26,-20" fill="#94a3b8" stroke="#f1f5f9" stroke-width="2" />
        <ellipse cx="0" cy="10" rx="48" ry="8" fill="#cbd5e1" stroke="#f1f5f9" stroke-width="1.5" />
        <line x1="0" y1="-20" x2="0" y2="-32" stroke="#f1f5f9" stroke-width="2" />
        <circle cx="0" cy="-32" r="3" fill="${neonAmber}" class="anim-pulse" />
      </g>
    `;
  }

  if (accessories.includes('rubber-duck')) {
    accSvg += `
      <!-- Rubber Duck Co-Pilot -->
      <g id="acc-duck" transform="translate(68, 148)">
        <ellipse cx="0" cy="8" rx="14" ry="10" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
        <circle cx="2" cy="-4" r="9" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
        <!-- Beak -->
        <polygon points="-7,-4 -15,-2 -7,1" fill="#ea580c" />
        <!-- Eye -->
        <circle cx="-1" cy="-6" r="2" fill="${neonPink}" />
      </g>
    `;
  }

  if (accessories.includes('ethernet-tail')) {
    accSvg += `
      <!-- Glowing RJ-45 Ethernet Tail -->
      <g id="acc-tail">
        <path d="M235,270 C280,270 290,230 300,190" fill="none" stroke="${neonAmber}" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 3" />
        <!-- RJ45 Plug head -->
        <rect x="290" y="175" width="22" height="16" rx="3" fill="${darkMetal}" stroke="${neonAmber}" stroke-width="2" />
        <circle cx="296" cy="183" r="2.5" fill="${neonGreen}" class="anim-pulse" />
        <circle cx="304" cy="183" r="2.5" fill="${neonAmber}" class="anim-pulse" />
      </g>
    `;
  }

  if (accessories.includes('scanline-visor')) {
    accSvg += `
      <!-- Ambient Matrix Grid Overlay -->
      <g opacity="0.15">
        <line x1="0" y1="50" x2="320" y2="50" stroke="${neonGreen}" stroke-width="1" />
        <line x1="0" y1="100" x2="320" y2="100" stroke="${neonGreen}" stroke-width="1" />
        <line x1="0" y1="150" x2="320" y2="150" stroke="${neonGreen}" stroke-width="1" />
        <line x1="0" y1="200" x2="320" y2="200" stroke="${neonGreen}" stroke-width="1" />
        <line x1="0" y1="250" x2="320" y2="250" stroke="${neonGreen}" stroke-width="1" />
      </g>
    `;
  }

  // Complete SVG Canvas
  return `
    <svg viewBox="0 0 320 370" width="100%" height="100%" class="bot-svg-canvas" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradients -->
        <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1f2937" />
          <stop offset="100%" stop-color="#0b0f19" />
        </linearGradient>
        <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${neonCyan}" stop-opacity="0.3" />
          <stop offset="100%" stop-color="${neonCyan}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Holographic Aura & Pedestal -->
      <g id="hologram-pedestal">
        <ellipse cx="160" cy="335" rx="130" ry="25" fill="url(#haloGlow)" />
        <!-- Pedestal Tier 1 -->
        <ellipse cx="160" cy="342" rx="115" ry="18" fill="url(#pedestalGrad)" stroke="${neonCyan}" stroke-width="2" />
        <!-- Pedestal Ring 2 -->
        <ellipse cx="160" cy="336" rx="90" ry="12" fill="${darkMetal}" stroke="${neonCyan}" stroke-width="1.5" />
        <line x1="70" y1="336" x2="250" y2="336" stroke="${neonCyan}" stroke-width="1" stroke-dasharray="6 4" opacity="0.6" />
        <text x="160" y="360" fill="${neonCyan}" font-family="monospace" font-size="9" text-anchor="middle" letter-spacing="2">ASSEMBLY BAY // ACTIVE</text>
      </g>

      <!-- Assembly Layers in Z-Order -->
      ${feetSvg}
      ${bodySvg}
      ${heartSvg}
      ${headSvg}
      ${accSvg}
    </svg>
  `;
}

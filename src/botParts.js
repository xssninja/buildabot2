// Component Catalog for Build-A-Bot: The Cybernetic AI Deployment Fabricator
//
// Every part here maps to a REAL, published container image (or a small
// Dockerfile we generate ourselves) so `docker compose up` works out of the box.
//
//   HEAD  = inference server (or a cloud API uplink)       -> serves the model
//   HEART = the model itself (all support tool/function calling, required for MCP)
//   BODY  = agent UI / orchestrator that is an MCP *client*
//   FEET  = MCP tool server(s) the body can call (Streamable HTTP at /mcp)
//   POWER = GPU vendor the stack is built for

// ---------------------------------------------------------------------------
// HEAD // BRAIN  (inference engine)
// ---------------------------------------------------------------------------
export const HEAD_PARTS = [
  {
    id: 'ollama',
    engine: 'ollama',
    name: 'Ollama: The Pocket Goblin',
    short: 'Ollama Engine',
    category: 'LLM Engine',
    badge: 'Easiest • NVIDIA / AMD / CPU',
    icon: '🐱',
    funnyLore: 'Consumes quant files like potato chips. Boots in a blink and purrs softly when fed GGUF models.',
    technicalRole: 'llama.cpp-based server with native tool calling and an OpenAI-compatible /v1 API. Model is auto-pulled on first start.',
    gpuSupport: ['nvidia', 'amd', 'cpu'],
    cuteness: 95,
    ctfProwess: 84,
    defaultPort: 11434,
    recommendedFor: 'Quick start, local privacy, minimal setup'
  },
  {
    id: 'vllm',
    engine: 'vllm',
    name: 'vLLM: The Twin Turbines',
    short: 'vLLM Reactor',
    category: 'LLM Engine',
    badge: 'High Throughput • NVIDIA only',
    icon: '🚀',
    funnyLore: 'PagedAttention reactor with enough thrust to launch your desktop into low Earth orbit.',
    technicalRole: 'Continuous-batching OpenAI-compatible server, launched with --enable-auto-tool-choice so MCP tools work.',
    gpuSupport: ['nvidia'],
    cuteness: 75,
    ctfProwess: 96,
    defaultPort: 8000,
    recommendedFor: 'Big GPUs (16GB+), many users, maximum tokens/sec'
  },
  {
    id: 'llamacpp',
    engine: 'llamacpp',
    name: 'llama.cpp Server: The Tinkerer',
    short: 'llama.cpp Server',
    category: 'LLM Engine',
    badge: 'Lean GGUF • NVIDIA / CPU',
    icon: '🔧',
    funnyLore: 'Hand-tuned C++ with a soldering iron behind its ear. Downloads its own GGUF straight from Hugging Face.',
    technicalRole: 'Official ggml-org llama-server image with --jinja tool-call templates and an OpenAI-compatible API.',
    gpuSupport: ['nvidia', 'cpu'],
    cuteness: 88,
    ctfProwess: 88,
    defaultPort: 8080,
    recommendedFor: 'Fine-grained control, low overhead, CPU-only boxes'
  },
  {
    id: 'cloud',
    engine: 'cloud',
    name: 'Cloud Uplink: Orbital Relay',
    short: 'Cloud API Uplink',
    category: 'External Model',
    badge: 'No GPU needed • API key',
    icon: '🛰️',
    funnyLore: 'Beams your prompts to an orbital GPU supercluster. Zero fan noise, requires an API key sacrifice.',
    technicalRole: 'No local inference container. The body talks directly to Anthropic or OpenAI over their OpenAI-compatible APIs.',
    gpuSupport: ['nvidia', 'amd', 'cpu'],
    cuteness: 89,
    ctfProwess: 98,
    defaultPort: null,
    recommendedFor: 'Laptops without a GPU, frontier-level reasoning'
  }
];

// ---------------------------------------------------------------------------
// HEART // POWER CORE  (the model — every option supports tool calling)
// vram: approximate GB needed per engine (Q4 GGUF for ollama/llama.cpp, BF16/MXFP4 for vLLM)
// ---------------------------------------------------------------------------
export const HEART_PARTS = [
  {
    id: 'qwen3',
    name: 'Qwen3 8B: The Matrix Cryptographer',
    short: 'Qwen3 8B',
    category: 'Power Core',
    badge: 'Best all-rounder for tools',
    icon: '⚡',
    funnyLore: 'Thinks out loud in <think> tags, then calmly calls exactly the right MCP tool. Show-off.',
    technicalRole: 'Strong open-weights reasoning + reliable function calling. Great default for MCP agents.',
    engines: ['ollama', 'vllm', 'llamacpp'],
    models: { ollama: 'qwen3:8b', vllm: 'Qwen/Qwen3-8B', llamacpp: 'Qwen/Qwen3-8B-GGUF:Q4_K_M' },
    vllmToolParser: 'hermes',
    vram: { ollama: 6, llamacpp: 6, vllm: 18 },
    cuteness: 93,
    ctfProwess: 96,
    promptFocus: 'Reverse Engineering, Exploit Auditing, Vulnerability Analysis'
  },
  {
    id: 'llama31',
    name: 'Llama 3.1 8B Instruct: The Stoic Sentinel',
    short: 'Llama 3.1 8B',
    category: 'Power Core',
    badge: 'Rock-solid classic',
    icon: '🦙',
    funnyLore: 'Reliable, polite, refuses to hallucinate unless provoked with absurd paradoxes.',
    technicalRole: 'Widely supported open model with native tool-call format. (vLLM build needs a Hugging Face token: gated repo.)',
    engines: ['ollama', 'vllm', 'llamacpp'],
    models: { ollama: 'llama3.1:8b', vllm: 'meta-llama/Llama-3.1-8B-Instruct', llamacpp: 'bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M' },
    vllmToolParser: 'llama3_json',
    needsHfToken: { vllm: true },
    vram: { ollama: 6, llamacpp: 6, vllm: 18 },
    cuteness: 96,
    ctfProwess: 87,
    promptFocus: 'Balanced Intelligence, High Context Retention, Clean Script Generation'
  },
  {
    id: 'gptoss',
    name: 'gpt-oss 20B: The Heavy Auditor',
    short: 'gpt-oss 20B',
    category: 'Power Core',
    badge: 'Agentic heavyweight',
    icon: '🎯',
    funnyLore: 'Brings a clipboard, a hard hat and a 20-billion-parameter checklist to every pentest.',
    technicalRole: 'OpenAI open-weights MoE model built for agentic tool use. Needs ~14-16GB VRAM.',
    engines: ['ollama', 'vllm', 'llamacpp'],
    models: { ollama: 'gpt-oss:20b', vllm: 'openai/gpt-oss-20b', llamacpp: 'ggml-org/gpt-oss-20b-GGUF' },
    vllmToolParser: 'openai',
    vram: { ollama: 14, llamacpp: 14, vllm: 16 },
    cuteness: 90,
    ctfProwess: 97,
    promptFocus: 'OWASP Pentesting, Responsible Disclosure, Exploit Reproduction & Defense'
  },
  {
    id: 'potato',
    name: 'Qwen3 1.7B: Potato Pilot',
    short: 'Potato Core 1.7B',
    category: 'Power Core',
    badge: 'Runs on a toaster',
    icon: '🥔',
    funnyLore: 'Runs so light it could be powered by a lemon battery. Still knows how to call a tool!',
    technicalRole: 'Tiny tool-capable model; ~2GB. Good for CPU-only machines and quick demos.',
    engines: ['ollama', 'vllm', 'llamacpp'],
    models: { ollama: 'qwen3:1.7b', vllm: 'Qwen/Qwen3-1.7B', llamacpp: 'Qwen/Qwen3-1.7B-GGUF:Q8_0' },
    vllmToolParser: 'hermes',
    vram: { ollama: 2, llamacpp: 2, vllm: 6 },
    cuteness: 100,
    ctfProwess: 72,
    promptFocus: 'Micro Edge Computing, Fast Heuristics, IoT Security Audits'
  },
  {
    id: 'cloud-claude',
    name: 'Claude (Anthropic API): Orbital Singularity',
    short: 'Claude via API',
    category: 'Power Core',
    badge: 'Needs Cloud Uplink head',
    icon: '🌌',
    funnyLore: 'Direct uplink to orbital GPU superclusters. High IQ, requires an ANTHROPIC_API_KEY sacrifice.',
    technicalRole: "Uses Anthropic's OpenAI-compatible endpoint, so every body can use it. Model name is editable in .env.",
    engines: ['cloud'],
    provider: 'anthropic',
    models: { cloud: 'claude-sonnet-4-5' },
    vram: { cloud: 0 },
    cuteness: 89,
    ctfProwess: 98,
    promptFocus: 'Extreme Deep Reasoning, Multi-Step Strategy, High Precision Planning'
  },
  {
    id: 'cloud-openai',
    name: 'OpenAI API: The Mothership',
    short: 'OpenAI via API',
    category: 'Power Core',
    badge: 'Needs Cloud Uplink head',
    icon: '🛸',
    funnyLore: 'The mothership hovers patiently, waiting for an OPENAI_API_KEY to beam you aboard.',
    technicalRole: 'Standard OpenAI Chat Completions with tool calling. Model name is editable in .env.',
    engines: ['cloud'],
    provider: 'openai',
    models: { cloud: 'gpt-4.1-mini' },
    vram: { cloud: 0 },
    cuteness: 86,
    ctfProwess: 95,
    promptFocus: 'Fast Planning, Broad Knowledge, Reliable Tool Use'
  }
];

// ---------------------------------------------------------------------------
// BODY // MISSION CONTROL  (agent UI — every option is an MCP client)
// ---------------------------------------------------------------------------
export const BODY_PARTS = [
  {
    id: 'openwebui',
    name: 'Open WebUI: Sleek Command Bunker',
    short: 'Open WebUI',
    category: 'Agent UI',
    badge: 'Native MCP (Streamable HTTP)',
    icon: '🛡️',
    funnyLore: 'Looks so slick your teammates will think you bought a private enterprise subscription.',
    technicalRole: 'ChatGPT-style UI with RAG and web search. Add MCP servers under Admin Settings → External Tools.',
    mcpSetup: 'manual',
    cuteness: 92,
    ctfProwess: 88,
    defaultPort: 3000
  },
  {
    id: 'anythingllm',
    name: 'AnythingLLM: The Iron Vault',
    short: 'AnythingLLM',
    category: 'Agent UI',
    badge: 'MCP auto-configured',
    icon: '🏦',
    funnyLore: 'Gulps down 2,000 incident-response PDFs without breaking a single byte of sweat.',
    technicalRole: 'All-in-one RAG + agent workspace. Your MCP servers are pre-wired into its agent skills file.',
    mcpSetup: 'auto',
    cuteness: 87,
    ctfProwess: 90,
    defaultPort: 3000
  },
  {
    id: 'flowise',
    name: 'Flowise: The Spaghet Node Matrix',
    short: 'Flowise',
    category: 'Agent UI',
    badge: 'Visual agent builder + MCP node',
    icon: '🪢',
    funnyLore: 'Lets you wire together agents with colorful noodle wires. Extremely satisfying to drag around.',
    technicalRole: 'Drag-and-drop LangChain agent flows. Use the "Custom MCP" tool node with the URLs from the README.',
    mcpSetup: 'manual',
    cuteness: 90,
    ctfProwess: 91,
    defaultPort: 3000
  },
  {
    id: 'n8n',
    name: 'n8n: The Tactical Pincer Daemon',
    short: 'n8n Agent',
    category: 'Agent UI',
    badge: 'Automation + MCP Client node',
    icon: '🦞',
    funnyLore: 'Snaps its claws at mundane manual tasks and chains workflows together while sipping motor oil.',
    technicalRole: 'Workflow automation with an AI Agent node and an MCP Client Tool node for each server.',
    mcpSetup: 'manual',
    cuteness: 86,
    ctfProwess: 95,
    defaultPort: 3000
  }
];

// ---------------------------------------------------------------------------
// FEET // MCP TOOLING  (every option is a real MCP server on Streamable HTTP)
// ---------------------------------------------------------------------------
export const FEET_PARTS = [
  {
    id: 'mcp-deck',
    name: 'Web Tools MCP Cyber-Deck',
    short: 'Web Tools MCP',
    category: 'MCP Server',
    badge: 'Fetch pages + headers (internet)',
    icon: '🔌',
    funnyLore: 'A pocket deck that lets your bot fetch any web page and read its headers. Small, fast, built locally.',
    technicalRole: 'Python FastMCP server with fetch_url and http_headers tools. Gives the agent outbound web access.',
    service: 'web-tools-mcp',
    port: 8811,
    cuteness: 91,
    ctfProwess: 94
  },
  {
    id: 'browser-use',
    name: 'Playwright Browser MCP',
    short: 'Playwright MCP',
    category: 'MCP Server',
    badge: 'Official Microsoft image',
    icon: '🌐',
    funnyLore: 'Sprouts cyber-spider legs and skitters across the DOM hunting for hidden tokens and buried secrets.',
    technicalRole: 'Headless Chromium the agent can click, type and snapshot through MCP (mcr.microsoft.com/playwright/mcp).',
    service: 'playwright-mcp',
    port: 8931,
    cuteness: 88,
    ctfProwess: 98
  },
  {
    id: 'workspace',
    name: 'Workspace Files MCP',
    short: 'Workspace MCP',
    category: 'MCP Server',
    badge: 'Shared ./workspace folder',
    icon: '🗂️',
    funnyLore: 'A tidy little backpack. Your bot can read notes you drop in and write its reports back out.',
    technicalRole: 'Python FastMCP server with list_files, read_file and write_file, locked to the ./workspace folder.',
    service: 'workspace-mcp',
    port: 8812,
    cuteness: 92,
    ctfProwess: 86
  },
  {
    id: 'chroma-tank',
    name: 'Qdrant Memory Tank MCP',
    short: 'Qdrant Memory MCP',
    category: 'MCP Server',
    badge: 'Long-term vector memory',
    icon: '🧠',
    funnyLore: 'Magnetic levitation tank filled with glowing vector embeddings. Never forgets a subnet.',
    technicalRole: 'Qdrant vector DB + the official mcp-server-qdrant (qdrant-store / qdrant-find tools).',
    service: 'qdrant-mcp',
    port: 8813,
    cuteness: 93,
    ctfProwess: 89
  }
];

// ---------------------------------------------------------------------------
// POWER SUPPLY // GPU
// ---------------------------------------------------------------------------
export const GPU_PARTS = [
  {
    id: 'nvidia',
    name: 'NVIDIA CUDA Reactor',
    short: 'NVIDIA GPU',
    badge: 'Needs NVIDIA Container Toolkit',
    icon: '🟩',
    funnyLore: 'Plugs straight into your CUDA cores. On Windows: Docker Desktop + WSL2 + current NVIDIA driver.',
    cuteness: 90,
    ctfProwess: 95
  },
  {
    id: 'amd',
    name: 'AMD ROCm Furnace',
    short: 'AMD GPU',
    badge: 'Linux host + Ollama only',
    icon: '🟥',
    funnyLore: 'Runs hot and proud. ROCm passthrough needs a Linux host (/dev/kfd + /dev/dri).',
    cuteness: 88,
    ctfProwess: 88
  },
  {
    id: 'cpu',
    name: 'CPU Hamster Wheel',
    short: 'CPU only',
    badge: 'Works anywhere, slower',
    icon: '🐹',
    funnyLore: 'No GPU? No problem. A very determined hamster does the matrix math.',
    cuteness: 99,
    ctfProwess: 70
  }
];

// ---------------------------------------------------------------------------
// MODEL SOURCE // where model weights come from
// ---------------------------------------------------------------------------
export const SOURCE_PARTS = [
  {
    id: 'internet',
    name: 'Internet Download',
    short: 'Internet',
    badge: 'Ollama registry / Hugging Face',
    icon: '🌍',
    funnyLore: 'Downloads the model on first start. Simple, but needs a few GB of internet bandwidth.',
    cuteness: 90,
    ctfProwess: 90
  },
  {
    id: 'share',
    name: 'Network Share (SMB / NFS / folder)',
    short: 'Network share',
    badge: 'No model downloads from the internet',
    icon: '🗄️',
    funnyLore: 'Loads models from a shared folder on your network. Set the share path in .env.',
    technicalRole: 'Ollama: ollama/ folder (blobs + manifests). llama.cpp: a .gguf file. vLLM: a Hugging Face model folder.',
    cuteness: 92,
    ctfProwess: 92
  }
];

// ---------------------------------------------------------------------------
// Compatibility helpers
// ---------------------------------------------------------------------------
export function findPart(list, id) {
  return list.find(p => p.id === id) || list[0];
}

export function isHeartCompatible(head, heart) {
  return heart.engines.includes(head.engine);
}

export function isHeadGpuCompatible(head, gpuId) {
  return head.gpuSupport.includes(gpuId);
}

// Returns a corrected config where every part is compatible with the others.
export function normalizeConfig(config) {
  const cfg = { ...config };
  let head = findPart(HEAD_PARTS, cfg.headId);
  if (!GPU_PARTS.some(g => g.id === cfg.gpuId)) cfg.gpuId = 'nvidia';
  if (!isHeadGpuCompatible(head, cfg.gpuId)) {
    // keep the GPU the user chose, swap the engine
    head = HEAD_PARTS.find(h => isHeadGpuCompatible(h, cfg.gpuId)) || HEAD_PARTS[0];
  }
  cfg.headId = head.id;
  let heart = findPart(HEART_PARTS, cfg.heartId);
  if (!isHeartCompatible(head, heart)) {
    heart = HEART_PARTS.find(h => isHeartCompatible(head, h));
  }
  cfg.heartId = heart.id;
  if (!SOURCE_PARTS.some(s => s.id === cfg.sourceId)) cfg.sourceId = 'internet';
  if (head.engine === 'cloud') cfg.sourceId = 'internet';
  cfg.bodyId = findPart(BODY_PARTS, cfg.bodyId).id;
  cfg.feetId = findPart(FEET_PARTS, cfg.feetId).id;
  return cfg;
}

export function estimateVram(config) {
  const head = findPart(HEAD_PARTS, config.headId);
  const heart = findPart(HEART_PARTS, config.heartId);
  if (config.gpuId === 'cpu') return 0;
  return heart.vram[head.engine] ?? 0;
}

export const ACCESSORY_PARTS = [
  {
    id: 'tinfoil-hat',
    name: 'Tinfoil Hacker Bucket Hat',
    icon: '👒',
    effect: '+10 Anti-Telemetry & Paranoia',
    description: 'Guarantees zero unauthorized telemetries escape to big tech clouds.'
  },
  {
    id: 'rubber-duck',
    name: 'Cyber-Duck Co-Pilot',
    icon: '🦆',
    effect: '+25 Rubber Duck Debugging',
    description: 'Sits quietly on your bot shoulder. Quacks whenever a syntax error occurs.'
  },
  {
    id: 'ethernet-tail',
    name: 'Glowing RJ-45 Ethernet Tail',
    icon: '🔌',
    effect: '+15 Gigabit Connectivity Aura',
    description: 'A prehensile CAT-7 cable with blinking link activity LEDs.'
  },
  {
    id: 'scanline-visor',
    name: 'Retro CRT Scanline Aura',
    icon: '📺',
    effect: '+100 80s Cyberpunk Aesthetic',
    description: 'Projects authentic phosphor green scanlines onto any monitor.'
  }
];

// Dynamic Funny Hacker Name Generator
const PREFIXES = [
  'ZeroDay', 'Byte', 'Sudo', 'Kernel', 'Glitch', 'Cipher', 'Quantum',
  'Pwn', 'Root', 'Buffer', 'Crypto', 'Payload', 'Echo', 'Neko', 'Stack'
];

const CORES = [
  'Nibbler', 'Claws', 'Chonker', 'Snuggles', 'Overfluff', 'Phantom',
  'Whiskers', 'Gremlin', 'Sentinel', 'Cracker', 'Sprite', 'Beast'
];

const SUFFIXES = [
  '3000', 'v0.9b', 'The Ethical Menace', '0x42', 'Pro Max',
  'The Flag Snatcher', '[White-Hat]', 'MK-II', 'Alpha', 'Leet'
];

export function generateFunnyName(seed = '') {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const c = CORES[Math.floor(Math.random() * CORES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${p}${c} ${s}`;
}

// Builds the core Docker stack (engine, model, UI, MCP tools, GPU, ports, network).
// Output is plain YAML text. Compose-level variables (${VAR:-default}) are kept
// literal so users can change ports/models in .env without re-downloading.
import { HEAD_PARTS, BODY_PARTS, HEART_PARTS, FEET_PARTS, GPU_PARTS, findPart, normalizeConfig } from './botParts.js';

const NET = ['    networks:', '      - buildabot-net'];
const RESTART = '    restart: unless-stopped';
const port = (envVar, def, inner) => `      - "\${BIND_ADDR:-0.0.0.0}:\${${envVar}:-${def}}:${inner}"`;

function gpuLines(gpuId) {
  if (gpuId === 'nvidia') {
    return [
      '    deploy:',
      '      resources:',
      '        reservations:',
      '          devices:',
      '            - driver: nvidia',
      '              count: all',
      '              capabilities: [gpu]'
    ];
  }
  if (gpuId === 'amd') {
    return ['    devices:', '      - /dev/kfd', '      - /dev/dri', '    group_add:', '      - video'];
  }
  return [];
}

const nvidiaEnv = gpuId => gpuId === 'nvidia'
  ? ['      - NVIDIA_VISIBLE_DEVICES=all', '      - NVIDIA_DRIVER_CAPABILITIES=compute,utility']
  : [];

// Describe how the UI reaches the model (always from INSIDE the docker network)
export function resolveLlm(cfg) {
  const head = findPart(HEAD_PARTS, cfg.headId);
  const heart = findPart(HEART_PARTS, cfg.heartId);
  const model = heart.models[head.engine];
  switch (head.engine) {
    case 'ollama':
      return { engine: 'ollama', service: 'ollama', container: 'buildabot-ollama', baseUrl: 'http://ollama:11434/v1', ollamaUrl: 'http://ollama:11434', model, modelVar: model, apiKey: 'ollama', internalPort: 11434 };
    case 'vllm':
      return { engine: 'vllm', service: 'vllm', container: 'buildabot-vllm', baseUrl: 'http://vllm:8000/v1', model: heart.id, modelVar: model, apiKey: 'sk-local', internalPort: 8000 };
    case 'llamacpp':
      return { engine: 'llamacpp', service: 'llamacpp', container: 'buildabot-llamacpp', baseUrl: 'http://llamacpp:8080/v1', model: heart.id, modelVar: model, apiKey: 'sk-local', internalPort: 8080 };
    default: {
      const anthropic = heart.provider === 'anthropic';
      return {
        engine: 'cloud', provider: heart.provider, service: null,
        baseUrl: anthropic ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1',
        model: '${CLOUD_MODEL:-' + model + '}', modelVar: model,
        apiKey: anthropic ? '${ANTHROPIC_API_KEY}' : '${OPENAI_API_KEY}',
        keyVar: anthropic ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'
      };
    }
  }
}

function headService(cfg, llm, heart) {
  const g = cfg.gpuId;
  if (llm.engine === 'ollama') {
    const image = g === 'amd' ? 'ollama/ollama:rocm' : 'ollama/ollama:latest';
    return [
      '  ollama:',
      `    image: ${image}`,
      '    container_name: buildabot-ollama',
      RESTART,
      '    ports:',
      port('ENGINE_PORT', 11434, 11434),
      '    environment:',
      '      - OLLAMA_HOST=0.0.0.0:11434',
      '      - OLLAMA_KEEP_ALIVE=30m',
      ...nvidiaEnv(g),
      '    volumes:',
      '      - ollama_models:/root/.ollama',
      '    healthcheck:',
      '      test: ["CMD", "ollama", "list"]',
      '      interval: 10s',
      '      timeout: 5s',
      '      retries: 30',
      ...gpuLines(g),
      ...NET,
      '',
      '  # One-shot helper: downloads the model into the shared volume, then exits.',
      '  ollama-pull:',
      `    image: ${image}`,
      '    container_name: buildabot-ollama-pull',
      '    restart: "no"',
      '    entrypoint: ["/bin/sh", "-c"]',
      '    command: ["ollama pull ${MODEL_NAME:-' + llm.modelVar + '}"]',
      '    environment:',
      '      - OLLAMA_HOST=http://ollama:11434',
      '    depends_on:',
      '      ollama:',
      '        condition: service_healthy',
      ...NET
    ];
  }
  if (llm.engine === 'vllm') {
    return [
      '  vllm:',
      '    image: vllm/vllm-openai:latest',
      '    container_name: buildabot-vllm',
      RESTART,
      '    ipc: host',
      '    ports:',
      port('ENGINE_PORT', 8000, 8000),
      '    environment:',
      '      - HF_TOKEN=${HF_TOKEN:-}',
      ...nvidiaEnv(g),
      '    volumes:',
      '      - hf_cache:/root/.cache/huggingface',
      '    command:',
      '      - "--model"',
      '      - "${MODEL_NAME:-' + llm.modelVar + '}"',
      '      - "--served-model-name"',
      `      - "${heart.id}"`,
      '      - "--enable-auto-tool-choice"',
      '      - "--tool-call-parser"',
      `      - "${heart.vllmToolParser}"`,
      '      - "--max-model-len"',
      '      - "${MAX_CONTEXT:-16384}"',
      '      - "--gpu-memory-utilization"',
      '      - "0.90"',
      '      - "--host"',
      '      - "0.0.0.0"',
      '      - "--port"',
      '      - "8000"',
      ...gpuLines(g),
      ...NET
    ];
  }
  if (llm.engine === 'llamacpp') {
    const image = g === 'nvidia' ? 'ghcr.io/ggml-org/llama.cpp:server-cuda' : 'ghcr.io/ggml-org/llama.cpp:server';
    return [
      '  llamacpp:',
      `    image: ${image}`,
      '    container_name: buildabot-llamacpp',
      RESTART,
      '    ports:',
      port('ENGINE_PORT', 8080, 8080),
      '    environment:',
      '      - LLAMA_CACHE=/models',
      ...nvidiaEnv(g),
      '    volumes:',
      '      - llamacpp_models:/models',
      '    command:',
      '      - "-hf"',
      '      - "${MODEL_NAME:-' + llm.modelVar + '}"',
      '      - "--alias"',
      `      - "${heart.id}"`,
      '      - "--jinja"',
      '      - "--host"',
      '      - "0.0.0.0"',
      '      - "--port"',
      '      - "8080"',
      '      - "-c"',
      '      - "${MAX_CONTEXT:-16384}"',
      ...(g === 'nvidia' ? ['      - "-ngl"', '      - "999"'] : []),
      ...gpuLines(g),
      ...NET
    ];
  }
  return ['  # Cloud Uplink selected: no local inference container. The UI calls ' + llm.baseUrl];
}

function dependsOnHead(llm) {
  return llm.service ? ['    depends_on:', `      - ${llm.service}`] : [];
}

function bodyService(cfg, llm) {
  const body = findPart(BODY_PARTS, cfg.bodyId);
  const hostGw = ['    extra_hosts:', '      - "host.docker.internal:host-gateway"'];
  if (body.id === 'openwebui') {
    const env = llm.engine === 'ollama'
      ? ['      - OLLAMA_BASE_URL=' + llm.ollamaUrl, '      - ENABLE_OPENAI_API=false']
      : ['      - ENABLE_OLLAMA_API=false', '      - OPENAI_API_BASE_URL=' + llm.baseUrl, '      - OPENAI_API_KEY=' + llm.apiKey];
    return [
      '  open-webui:',
      '    image: ghcr.io/open-webui/open-webui:main',
      '    container_name: buildabot-ui',
      RESTART,
      '    ports:',
      port('UI_PORT', 3000, 8080),
      '    environment:',
      ...env,
      '      - WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY:-change-me-please}',
      '    volumes:',
      '      - open_webui_data:/app/backend/data',
      ...hostGw, ...dependsOnHead(llm), ...NET
    ];
  }
  if (body.id === 'anythingllm') {
    let env;
    if (llm.engine === 'ollama') {
      env = ['      - LLM_PROVIDER=ollama', '      - OLLAMA_BASE_PATH=' + llm.ollamaUrl, '      - OLLAMA_MODEL_PREF=${MODEL_NAME:-' + llm.modelVar + '}', '      - OLLAMA_MODEL_TOKEN_LIMIT=${MAX_CONTEXT:-16384}'];
    } else if (llm.engine === 'cloud' && llm.provider === 'anthropic') {
      env = ['      - LLM_PROVIDER=anthropic', '      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}', '      - ANTHROPIC_MODEL_PREF=' + llm.model];
    } else if (llm.engine === 'cloud') {
      env = ['      - LLM_PROVIDER=openai', '      - OPEN_AI_KEY=${OPENAI_API_KEY}', '      - OPEN_MODEL_PREF=' + llm.model];
    } else {
      env = ['      - LLM_PROVIDER=generic-openai', '      - GENERIC_OPEN_AI_BASE_PATH=' + llm.baseUrl, '      - GENERIC_OPEN_AI_MODEL_PREF=' + llm.model, '      - GENERIC_OPEN_AI_MODEL_TOKEN_LIMIT=${MAX_CONTEXT:-16384}', '      - GENERIC_OPEN_AI_API_KEY=' + llm.apiKey];
    }
    return [
      '  anythingllm:',
      '    image: mintplexlabs/anythingllm:latest',
      '    container_name: buildabot-ui',
      RESTART,
      '    cap_add:',
      '      - SYS_ADMIN',
      '    ports:',
      port('UI_PORT', 3000, 3001),
      '    environment:',
      '      - STORAGE_DIR=/app/server/storage',
      '      - JWT_SECRET=${ANYTHINGLLM_JWT_SECRET:-change-me-to-a-long-random-string}',
      ...env,
      '    volumes:',
      '      - anythingllm_storage:/app/server/storage',
      '      - ./config/anythingllm_mcp_servers.json:/app/server/storage/plugins/anythingllm_mcp_servers.json',
      ...hostGw, ...dependsOnHead(llm), ...NET
    ];
  }
  if (body.id === 'flowise') {
    return [
      '  flowise:',
      '    image: flowiseai/flowise:latest',
      '    container_name: buildabot-ui',
      RESTART,
      '    ports:',
      port('UI_PORT', 3000, 3000),
      '    environment:',
      '      - PORT=3000',
      '    volumes:',
      '      - flowise_data:/root/.flowise',
      ...hostGw, ...dependsOnHead(llm), ...NET
    ];
  }
  // n8n
  return [
    '  n8n:',
    '    image: docker.n8n.io/n8nio/n8n:latest',
    '    container_name: buildabot-ui',
    RESTART,
    '    ports:',
    port('UI_PORT', 3000, 5678),
    '    environment:',
    '      - N8N_SECURE_COOKIE=false',
    '      - N8N_PORT=5678',
    '      - GENERIC_TIMEZONE=${TZ:-UTC}',
    '    volumes:',
    '      - n8n_data:/home/node/.n8n',
    ...hostGw, ...dependsOnHead(llm), ...NET
  ];
}

function feetService(cfg) {
  const feet = findPart(FEET_PARTS, cfg.feetId);
  if (feet.id === 'mcp-deck') {
    return [
      '  web-tools-mcp:',
      '    build:',
      '      context: ./mcp-servers/web-tools',
      '    container_name: buildabot-web-tools-mcp',
      RESTART,
      '    ports:',
      port('MCP_PORT', 8811, 8811),
      ...NET
    ];
  }
  if (feet.id === 'browser-use') {
    return [
      '  playwright-mcp:',
      '    image: mcr.microsoft.com/playwright/mcp:latest',
      '    container_name: buildabot-playwright-mcp',
      RESTART,
      '    init: true',
      '    entrypoint: ["node", "cli.js"]',
      '    command: ["--headless", "--browser", "chromium", "--no-sandbox", "--host", "0.0.0.0", "--port", "8931", "--allowed-hosts", "*"]',
      '    ports:',
      port('MCP_PORT', 8931, 8931),
      ...NET
    ];
  }
  if (feet.id === 'workspace') {
    return [
      '  workspace-mcp:',
      '    build:',
      '      context: ./mcp-servers/workspace',
      '    container_name: buildabot-workspace-mcp',
      RESTART,
      '    ports:',
      port('MCP_PORT', 8812, 8812),
      '    volumes:',
      '      - ./workspace:/workspace',
      ...NET
    ];
  }
  // Qdrant memory
  return [
    '  qdrant:',
    '    image: qdrant/qdrant:latest',
    '    container_name: buildabot-qdrant',
    RESTART,
    '    volumes:',
    '      - qdrant_storage:/qdrant/storage',
    ...NET,
    '',
    '  qdrant-mcp:',
    '    image: ghcr.io/astral-sh/uv:python3.12-bookworm-slim',
    '    container_name: buildabot-qdrant-mcp',
    RESTART,
    '    command: ["uvx", "mcp-server-qdrant", "--transport", "streamable-http"]',
    '    environment:',
    '      - QDRANT_URL=http://qdrant:6333',
    '      - COLLECTION_NAME=buildabot-memory',
    '      - FASTMCP_HOST=0.0.0.0',
    '      - FASTMCP_PORT=8813',
    '    volumes:',
    '      - uv_cache:/root/.cache',
    '    ports:',
    port('MCP_PORT', 8813, 8813),
    '    depends_on:',
    '      - qdrant',
    ...NET
  ];
}

function egressCheck() {
  return [
    '  # One-shot check that containers can reach the internet (model + image downloads).',
    '  # See results with:  docker compose logs egress-check',
    '  egress-check:',
    '    image: curlimages/curl:latest',
    '    container_name: buildabot-egress-check',
    '    restart: "no"',
    '    entrypoint: ["/bin/sh", "-c"]',
    '    command:',
    '      - |',
    '        for u in https://huggingface.co https://registry.ollama.ai https://ghcr.io https://pypi.org; do',
    '          if curl -sS -o /dev/null --max-time 10 "$$u"; then echo "OK    $$u"; else echo "FAIL  $$u  (check VPN/proxy/firewall/DNS)"; fi',
    '        done',
    ...NET
  ];
}

export function mcpEndpoints(cfg) {
  const feet = findPart(FEET_PARTS, cfg.feetId);
  return [{ name: feet.short, key: feet.service, internal: `http://${feet.service}:${feet.port}/mcp`, host: `http://localhost:${feet.port}/mcp` }];
}

export function buildStack(rawCfg) {
  const cfg = normalizeConfig(rawCfg);
  const head = findPart(HEAD_PARTS, cfg.headId);
  const heart = findPart(HEART_PARTS, cfg.heartId);
  const body = findPart(BODY_PARTS, cfg.bodyId);
  const feet = findPart(FEET_PARTS, cfg.feetId);
  const gpu = findPart(GPU_PARTS, cfg.gpuId);
  const llm = resolveLlm(cfg);

  const services = [
    '  # ----------------------------------------------------------------------------',
    `  # 🧠 HEAD (inference engine): ${head.short}  •  ❤️ HEART (model): ${heart.short}  •  🔋 ${gpu.short}`,
    '  # ----------------------------------------------------------------------------',
    ...headService(cfg, llm, heart),
    '',
    '  # ----------------------------------------------------------------------------',
    `  # 🦾 BODY (agent UI / MCP client): ${body.short}`,
    '  # ----------------------------------------------------------------------------',
    ...bodyService(cfg, llm),
    '',
    '  # ----------------------------------------------------------------------------',
    `  # 🦿 FEET (MCP tool server): ${feet.short}  ->  ${mcpEndpoints(cfg)[0].internal}`,
    '  # ----------------------------------------------------------------------------',
    ...feetService(cfg),
    '',
    ...egressCheck()
  ].join('\n') + '\n';

  const volumes = ['ollama_models', 'hf_cache', 'llamacpp_models', 'open_webui_data', 'anythingllm_storage', 'flowise_data', 'n8n_data', 'qdrant_storage', 'uv_cache'];
  const volumesYaml = 'volumes:\n' + volumes.map(v => `  ${v}:`).join('\n') + '\n';
  const networksYaml = 'networks:\n  buildabot-net:\n    driver: bridge\n';

  return { cfg, head, heart, body, feet, gpu, llm, services, volumesYaml, networksYaml };
}

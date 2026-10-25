// Support files generated alongside docker-compose.yml
import { mcpEndpoints } from './stackBuilder.js';

const PY_DOCKERFILE = (port) => `FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir "mcp>=1.10,<2" "httpx>=0.27"
COPY server.py /app/
EXPOSE ${port}
CMD ["python", "server.py"]
`;

const WEB_TOOLS_PY = `"""Web Tools MCP server (Streamable HTTP at /mcp)."""
import re
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("web-tools", host="0.0.0.0", port=8811, stateless_http=True)

def _to_text(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|noscript).*?</\\1>", " ", html)
    text = re.sub(r"(?s)<[^>]+>", " ", html)
    return re.sub(r"\\s+", " ", text).strip()

@mcp.tool()
def fetch_url(url: str, max_chars: int = 20000, raw_html: bool = False) -> str:
    """Fetch a web page and return its readable text (or raw HTML)."""
    r = httpx.get(url, follow_redirects=True, timeout=20, headers={"User-Agent": "BuildABot-WebTools/1.0"})
    body = r.text if raw_html else _to_text(r.text)
    return f"HTTP {r.status_code} {r.url}\\n\\n{body[:max_chars]}"

@mcp.tool()
def http_headers(url: str) -> dict:
    """Return the status code and response headers for a URL."""
    r = httpx.get(url, follow_redirects=True, timeout=20)
    return {"status": r.status_code, "url": str(r.url), "headers": dict(r.headers)}

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`;

const WORKSPACE_PY = `"""Workspace Files MCP server (Streamable HTTP at /mcp). Locked to /workspace."""
from pathlib import Path
from mcp.server.fastmcp import FastMCP

ROOT = Path("/workspace").resolve()
mcp = FastMCP("workspace", host="0.0.0.0", port=8812, stateless_http=True)

def _safe(path: str) -> Path:
    p = (ROOT / path).resolve()
    if p != ROOT and ROOT not in p.parents:
        raise ValueError("Path must stay inside the workspace folder")
    return p

@mcp.tool()
def list_files(subdir: str = ".") -> list[str]:
    """List files in the workspace (or a subfolder of it)."""
    base = _safe(subdir)
    return sorted(str(p.relative_to(ROOT)) for p in base.rglob("*") if p.is_file())[:500]

@mcp.tool()
def read_file(path: str, max_chars: int = 50000) -> str:
    """Read a text file from the workspace."""
    return _safe(path).read_text(errors="replace")[:max_chars]

@mcp.tool()
def write_file(path: str, content: str) -> str:
    """Create or overwrite a text file in the workspace."""
    p = _safe(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    return f"Wrote {len(content)} chars to {p.relative_to(ROOT)}"

if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    mcp.run(transport="streamable-http")
`;

export function buildSupportFiles(stack, botName) {
  const { head, heart, body, feet, gpu, llm, cfg } = stack;
  const eps = mcpEndpoints(cfg);
  const files = {};

  if (feet.id === 'mcp-deck') {
    files['mcp-servers/web-tools/Dockerfile'] = PY_DOCKERFILE(8811);
    files['mcp-servers/web-tools/server.py'] = WEB_TOOLS_PY;
  }
  if (feet.id === 'workspace') {
    files['mcp-servers/workspace/Dockerfile'] = PY_DOCKERFILE(8812);
    files['mcp-servers/workspace/server.py'] = WORKSPACE_PY;
    files['workspace/README.txt'] = 'Files placed here are visible to your bot through the Workspace MCP server.\n';
  }
  if (body.id === 'anythingllm') {
    const servers = {};
    eps.forEach(e => { servers[e.key] = { type: 'streamable', url: e.internal }; });
    files['config/anythingllm_mcp_servers.json'] = JSON.stringify({ mcpServers: servers }, null, 2) + '\n';
  }

  // ---------- .env ----------
  const env = [
    '# ==============================================================================',
    `# 🤖 BUILD-A-BOT CONFIGURATION: ${botName}`,
    '# Edit values here, then run:  docker compose up -d',
    '# ==============================================================================',
    '',
    '# Which network interface to publish ports on.',
    '#   0.0.0.0   = reachable from other machines on your network (allow it in your firewall)',
    '#   127.0.0.1 = this computer only',
    'BIND_ADDR=0.0.0.0',
    '',
    `# Host ports (change any that clash with something already running)`,
    `# ${body.short} web UI`,
    'UI_PORT=3000',
    head.defaultPort ? `# ${head.short} API\nENGINE_PORT=${head.defaultPort}` : '# ENGINE_PORT not used (cloud model)',
    `# ${feet.short}`,
    `MCP_PORT=${feet.port}`,
    '',
    '# Model',
    llm.engine === 'cloud' ? `CLOUD_MODEL=${llm.modelVar}` : `MODEL_NAME=${llm.modelVar}`,
    'MAX_CONTEXT=16384',
    '',
    llm.engine === 'vllm' ? '# Hugging Face token (required for gated models like Llama)\nHF_TOKEN=\n' : '',
    llm.engine === 'cloud' ? `# Required for the cloud model\n${llm.keyVar}=\n` : '',
    body.id === 'openwebui' ? 'WEBUI_SECRET_KEY=change-me-please\n' : '',
    body.id === 'anythingllm' ? 'ANYTHINGLLM_JWT_SECRET=change-me-to-a-long-random-string\n' : '',
    'TZ=UTC',
    ''
  ].join('\n');
  files['.env'] = env;
  files['.env.example'] = env;

  // ---------- start scripts ----------
  const gpuCheckSh = gpu.id === 'nvidia' && llm.service ? `
if command -v nvidia-smi >/dev/null 2>&1; then
  echo "[GPU] Host GPU detected:"; nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
  echo "[GPU] WARNING: nvidia-smi not found. Install the NVIDIA driver + NVIDIA Container Toolkit, or rebuild with 'CPU only'."
fi` : '';
  const gpuVerifySh = gpu.id === 'nvidia' && llm.service ? `
echo "[GPU] Checking the GPU is visible inside ${llm.container}..."
sleep 5
docker exec ${llm.container} nvidia-smi -L || echo "[GPU] Not visible in the container. See README > Troubleshooting > GPU."` : '';

  files['start.sh'] = `#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "========================================================"
echo "  LAUNCHING: ${botName}"
echo "========================================================"
docker info >/dev/null 2>&1 || { echo "Docker is not running."; exit 1; }${gpuCheckSh}
mkdir -p workspace
docker compose up -d --build${gpuVerifySh}
echo ""
echo "[NET] Internet check from inside the Docker network:"
sleep 8; docker compose logs --no-log-prefix egress-check || true
echo ""
echo "UI:        http://localhost:\${UI_PORT:-3000}"
${llm.engine === 'ollama' ? 'echo "Model download progress:  docker compose logs -f ollama-pull"' : llm.service ? `echo "Model loading progress:   docker compose logs -f ${llm.service}"` : ''}
`;

  files['start.bat'] = `@echo off
cd /d "%~dp0"
echo ========================================================
echo   LAUNCHING: ${botName}
echo ========================================================
docker info >nul 2>&1 || (echo Docker Desktop is not running. & pause & exit /b 1)
${gpu.id === 'nvidia' && llm.service ? `where nvidia-smi >nul 2>&1 && (echo [GPU] Host GPU: & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader) || echo [GPU] WARNING: nvidia-smi not found - install the NVIDIA driver, or rebuild with CPU only.` : ''}
if not exist workspace mkdir workspace
docker compose up -d --build
${gpu.id === 'nvidia' && llm.service ? `echo [GPU] Checking the GPU is visible inside ${llm.container}...
timeout /t 5 >nul
docker exec ${llm.container} nvidia-smi -L || echo [GPU] Not visible in the container. See README - Troubleshooting - GPU.` : ''}
echo.
echo [NET] Internet check from inside the Docker network:
timeout /t 8 >nul
docker compose logs --no-log-prefix egress-check
echo.
echo UI: http://localhost:3000  (or the UI_PORT set in .env)
${llm.engine === 'ollama' ? 'echo Model download progress:  docker compose logs -f ollama-pull' : llm.service ? `echo Model loading progress:   docker compose logs -f ${llm.service}` : ''}
pause
`;

  // ---------- README stack section ----------
  const mcpTable = eps.map(e => `| ${e.name} | \`${e.internal}\` | \`${e.host}\` |`).join('\n');
  const uiSteps = {
    openwebui: `1. Open the UI and create the first account (it becomes the admin).
2. **Admin Settings → External Tools → +** → Type **MCP (Streamable HTTP)** → paste the *in-network* URL above.
3. In the model's settings set **Function Calling = Native**, then enable the tool in the chat (➕ / tools button).`,
    anythingllm: `1. Open the UI and finish the setup screens (the model is already configured).
2. Your MCP server is pre-loaded: **Settings → Agent Skills → MCP Servers** should list it.
3. In a workspace chat, start with \`@agent\` so the agent can call tools.`,
    flowise: `1. Create a **Agentflow / Chatflow** with a Tool Agent.
2. Chat model: ${llm.engine === 'ollama' ? `**ChatOllama**, Base URL \`${llm.ollamaUrl}\`, model \`${llm.model}\`` : `**ChatOpenAI Custom**, Base Path \`${llm.baseUrl}\`, model \`${llm.model}\``}.
3. Add a **Custom MCP** tool node pointing at the *in-network* URL above.`,
    n8n: `1. Create an owner account, then a workflow with **Chat Trigger → AI Agent**.
2. Chat model: ${llm.engine === 'ollama' ? `**Ollama Chat Model**, Base URL \`${llm.ollamaUrl}\`, model \`${llm.model}\`` : `**OpenAI Chat Model** with a custom Base URL \`${llm.baseUrl}\`, model \`${llm.model}\``}.
3. Add an **MCP Client Tool** to the agent with the *in-network* URL above (transport: HTTP Streamable).`
  }[body.id];

  const readmeStack = `## 📋 Bot Specifications

| Part | Choice |
|---|---|
| 🧠 Head (engine) | ${head.name} |
| ❤️ Heart (model) | ${heart.name} → \`${llm.modelVar}\` |
| 🦾 Body (UI / MCP client) | ${body.name} |
| 🦿 Feet (MCP server) | ${feet.name} |
| 🔋 Power | ${gpu.name} |

## 🚀 Quickstart

1. Install **Docker Desktop** (Windows/macOS) or Docker Engine + Compose v2 (Linux).
${gpu.id === 'nvidia' ? '   - NVIDIA: current NVIDIA driver. Windows needs Docker Desktop with the **WSL2** backend. Linux needs the **NVIDIA Container Toolkit**.\n' : ''}${gpu.id === 'amd' ? '   - AMD: Linux host with ROCm drivers (`/dev/kfd` and `/dev/dri` must exist). Docker Desktop on Windows/macOS cannot pass AMD GPUs through.\n' : ''}${llm.engine === 'cloud' ? `   - Put your \`${llm.keyVar}\` in \`.env\`.\n` : ''}2. Run \`start.bat\` (Windows) or \`./start.sh\` (Linux/macOS).
3. Open **http://localhost:3000** (or the \`UI_PORT\` in \`.env\`).
${llm.engine !== 'cloud' ? '\nThe first start downloads the model (several GB). The UI may show no models until that finishes.\n' : ''}
## 🔌 Connecting your MCP tools

Containers reach each other by **service name**, not \`localhost\` (inside a container, \`localhost\` is that container itself).

| MCP server | URL to use **inside the UI** | URL from your computer |
|---|---|---|
${mcpTable}

${uiSteps}

Model endpoint (OpenAI-compatible, for any UI or tool): \`${llm.baseUrl}\` · model \`${llm.model}\`

## 🧰 Troubleshooting

- **GPU not used** – run \`docker exec ${llm.container || '<engine container>'} nvidia-smi\`. If it fails: update the NVIDIA driver; on Windows enable WSL2 in Docker Desktop; on Linux install the NVIDIA Container Toolkit and run \`sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker\`. ${llm.engine === 'ollama' ? '`docker compose logs ollama | grep -i gpu` shows what Ollama detected; `docker exec buildabot-ollama ollama ps` shows GPU vs CPU split.' : ''}
- **Can't open a port** – another app may be using it: change it in \`.env\`. From another machine, allow the port in your firewall (Windows Defender Firewall → Inbound rules).
- **No internet inside containers** – \`docker compose logs egress-check\`. FAIL lines usually mean a VPN, corporate proxy, or DNS issue. In Docker Desktop, check **Settings → Resources → Proxies**.
- **Model too big** – pick a smaller Heart or set \`MAX_CONTEXT=8192\` in \`.env\`.
`;

  return { files, readmeStack };
}

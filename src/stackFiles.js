// Support files generated alongside docker-compose.yml
import { mcpEndpoints } from './stackBuilder.js';
import { CONFERENCE, LAN_MODE } from './conference.js';

const FETCH_PY = "\"\"\"Downloads this bot's model from the LAN model server (MODELS_URL).\nResumes interrupted downloads and verifies Ollama blobs by their sha256 name.\"\"\"\nimport hashlib, json, os, sys, time, urllib.error, urllib.request\n\nBASE = os.environ[\"MODELS_URL\"].rstrip(\"/\")\nMODE = os.environ[\"FETCH_MODE\"]  # \"ollama\" or \"gguf\"\n\n\ndef sha256_of(path):\n    h = hashlib.sha256()\n    with open(path, \"rb\") as f:\n        while block := f.read(1 << 20):\n            h.update(block)\n    return h.hexdigest()\n\n\ndef get(url, dest, sha=None):\n    if os.path.exists(dest):\n        print(\"already have\", os.path.basename(dest), flush=True)\n        return\n    os.makedirs(os.path.dirname(dest), exist_ok=True)\n    part = dest + \".part\"\n    for attempt in range(6):\n        have = os.path.getsize(part) if os.path.exists(part) else 0\n        req = urllib.request.Request(url, headers={\"Range\": f\"bytes={have}-\"} if have else {})\n        try:\n            with urllib.request.urlopen(req, timeout=30) as r:\n                if have and r.status != 206:\n                    have = 0  # server ignored the resume request; start over\n                total = have + int(r.headers.get(\"Content-Length\") or 0)\n                done, last = have, 0.0\n                with open(part, \"ab\" if have else \"wb\") as f:\n                    while chunk := r.read(1 << 20):\n                        f.write(chunk)\n                        done += len(chunk)\n                        if total and time.time() - last > 5:\n                            print(f\"  {os.path.basename(dest)}: {done * 100 // total}% of {total // 2**20} MB\", flush=True)\n                            last = time.time()\n            break\n        except urllib.error.HTTPError as e:\n            if e.code == 416:  # nothing left to download\n                break\n            if e.code in (401, 403, 404):\n                sys.exit(f\"LAN model server returned {e.code} for {url}\")\n            print(f\"server error {e.code}, retrying...\", flush=True)\n        except (urllib.error.URLError, OSError) as e:\n            print(f\"connection problem ({e}), retrying...\", flush=True)\n        time.sleep(3 * (attempt + 1))\n    else:\n        sys.exit(f\"Could not download {url}\")\n    if sha and sha256_of(part) != sha:\n        os.remove(part)\n        sys.exit(f\"Checksum mismatch for {url}; run start again to retry\")\n    os.replace(part, dest)\n\n\nif MODE == \"ollama\":\n    name = os.environ[\"MODEL_NAME\"]\n    model, _, tag = name.partition(\":\")\n    tag = tag or \"latest\"\n    if \"/\" not in model:\n        model = \"library/\" + model\n    rel = f\"manifests/registry.ollama.ai/{model}/{tag}\"\n    dst = \"/dest/models\"\n    tmp = f\"/dest/.fetch/{rel}\"\n    get(f\"{BASE}/ollama/{rel}\", tmp)\n    manifest = json.load(open(tmp))\n    for d in [manifest[\"config\"][\"digest\"]] + [layer[\"digest\"] for layer in manifest[\"layers\"]]:\n        blob = d.replace(\":\", \"-\")\n        get(f\"{BASE}/ollama/blobs/{blob}\", f\"{dst}/blobs/{blob}\", sha=d.split(\":\", 1)[1])\n    os.makedirs(os.path.dirname(f\"{dst}/{rel}\"), exist_ok=True)\n    os.replace(tmp, f\"{dst}/{rel}\")  # manifest last, so Ollama only sees complete models\nelse:\n    f = os.environ[\"MODEL_FILE\"]\n    get(f\"{BASE}/gguf/{f}\", f\"/models/{os.path.basename(f)}\")\nprint(\"Model ready from the LAN model server.\", flush=True)\n";

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
  const lanUrl = cfg.sourceId === 'share' && LAN_MODE === 'url';
  const share = cfg.sourceId === 'share' && !lanUrl;
  const eps = mcpEndpoints(cfg);
  const files = {};
  if (lanUrl) files['model-fetch/fetch.py'] = FETCH_PY;

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
    '# Who can reach these services:',
    '#   127.0.0.1 = this computer only (default, safest)',
    '#   0.0.0.0   = also other devices on your network (then allow the ports in your firewall).',
    '#               The model API and MCP servers have no login, so only do this on a network you trust.',
    'BIND_ADDR=127.0.0.1',
    '',
    `# Host ports (change any that clash with something already running)`,
    `# ${body.short} web UI`,
    'UI_PORT=3000',
    head.defaultPort ? `# ${head.short} API\nENGINE_PORT=${head.defaultPort}` : '# ENGINE_PORT not used (cloud model)',
    `# ${feet.short}`,
    `MCP_PORT=${feet.port}`,
    '',
    ...(lanUrl ? [
      '# ---- LAN model server (models download from here, not the internet) ----',
      '# Folders on the server: ollama/ (blobs + manifests), gguf/ (.gguf files)',
      `MODELS_URL=${CONFERENCE.modelsUrl}`,
      llm.engine === 'llamacpp' ? `# .gguf file inside the server's gguf/ folder\nMODEL_FILE=${heart.id}.gguf` : '',
      ''
    ] : []),
    ...(share ? [
      '# ---- Network model share (models load from here, not the internet) ----',
      '# SMB/Windows share (default):  MODELS_SHARE=//nas-or-pc-name/models',
      '#   guest access:              SHARE_OPTIONS=ro,vers=3.0,guest',
      '#   with a login:              SHARE_OPTIONS=ro,vers=3.0,username=YOURUSER,password=YOURPASS',
      '# NFS share:                    SHARE_TYPE=nfs  MODELS_SHARE=:/export/models  SHARE_OPTIONS=addr=192.168.1.50,ro,nfsvers=4',
      '# Folder already on this host:  SHARE_TYPE=none MODELS_SHARE=/path/to/models  SHARE_OPTIONS=bind',
      'SHARE_TYPE=cifs',
      `MODELS_SHARE=${CONFERENCE.modelsShare}`,
      `SHARE_OPTIONS=${CONFERENCE.shareOptions}`,
      llm.engine === 'ollama' ? '# Folder on the share holding the Ollama models dir (blobs/ + manifests/)\nOLLAMA_SHARE_DIR=ollama' : '',
      llm.engine === 'llamacpp' ? `# .gguf file on the share, relative to the share root\nMODEL_FILE=gguf/${heart.id}.gguf` : '',
      llm.engine === 'vllm' ? `# Hugging Face model folder on the share, relative to the share root\nMODEL_DIR=hf/${llm.modelVar.split('/').pop()}` : '',
      ''
    ] : []),
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
${share || lanUrl ? `
# ---- Model source check: fall back to the internet when the LAN share is gone ----
if ! grep -q '^COMPOSE_FILE=docker-compose.internet.yml' .env; then
  echo "[MODELS] Checking the LAN model source..."
  if ! out=$(docker compose run --rm share-check 2>&1); then
    echo "[MODELS] The LAN model source isn't reachable (or is empty):"
    echo "$out" | tail -n 3
    echo "         That's expected after the conference or on another network."
    read -r -p "Download models from the internet instead? [y/N] " a
    case "$a" in
      y|Y) echo 'COMPOSE_FILE=docker-compose.internet.yml' >> .env
           echo "[MODELS] Switched to internet downloads (see .env to switch back)." ;;
      *)   echo "Check MODELS_URL / MODELS_SHARE in .env (or connect to the conference network) and run again."; exit 1 ;;
    esac
  fi
fi` : ''}
mkdir -p workspace
docker compose up -d --build || { bash ./doctor.sh failed; exit 1; }${gpuVerifySh}
echo ""
echo "[NET] Internet check from inside the Docker network:"
sleep 8; docker compose logs --no-log-prefix egress-check || true
echo ""
echo "UI:        http://localhost:\${UI_PORT:-3000}"
${llm.engine === 'ollama' ? 'echo "Model download progress:  docker compose logs -f ollama-pull"' : llm.service ? `echo "Model loading progress:   docker compose logs -f ${llm.service}"` : ''}
echo ""
echo "[DOCTOR] Waiting 20s, then checking every service..."
sleep 20
bash ./doctor.sh
`;

  files['start.bat'] = `@echo off
cd /d "%~dp0"
echo ========================================================
echo   LAUNCHING: ${botName}
echo ========================================================
docker info >nul 2>&1 || (echo Docker Desktop is not running. & pause & exit /b 1)
${gpu.id === 'nvidia' && llm.service ? `where nvidia-smi >nul 2>&1 && (echo [GPU] Host GPU: & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader) || echo [GPU] WARNING: nvidia-smi not found - install the NVIDIA driver, or rebuild with CPU only.` : ''}
${share || lanUrl ? `
rem ---- Model source check: fall back to the internet when the LAN share is gone ----
findstr /b /c:"COMPOSE_FILE=docker-compose.internet.yml" .env >nul && goto models_ok
echo [MODELS] Checking the LAN model source...
docker compose run --rm share-check
if not errorlevel 1 goto models_ok
echo [MODELS] The LAN model source isn't reachable, or is empty - see the message above.
echo          That's expected after the conference or on another network.
choice /m "Download models from the internet instead"
if errorlevel 2 (
  echo Check MODELS_URL / MODELS_SHARE in .env, or connect to the conference network, and run again.
  pause
  exit /b 1
)
>>.env echo COMPOSE_FILE=docker-compose.internet.yml
echo [MODELS] Switched to internet downloads - see .env to switch back.
:models_ok` : ''}
if not exist workspace mkdir workspace
docker compose up -d --build || (call doctor.bat failed & pause & exit /b 1)
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
echo.
echo [DOCTOR] Waiting 20s, then checking every service...
timeout /t 20 >nul
call doctor.bat
pause
`;


  // ---------- doctor: find failing services, show logs, offer Docker AI ----------
  const aiPrompt = 'A service in my Docker Compose stack in this folder is failing. Read docker-compose.yml and .env, check the logs of the failing containers, explain the error in plain language and tell me exactly how to fix it.';
  files['doctor.sh'] = `#!/usr/bin/env bash
# Checks every service. Run any time:  ./doctor.sh
cd "$(dirname "$0")"
bad=$(docker compose ps -a --format '{{.Service}} {{.State}} {{.ExitCode}}' 2>/dev/null | awk '$2=="restarting" || ($2=="exited" && $3!="0") {print $1}')
if [ -z "$bad" ] && [ "$1" != "failed" ]; then echo "[DOCTOR] All services look healthy."; exit 0; fi
echo "========================================================"
echo "  [DOCTOR] Something went wrong"
echo "========================================================"
[ "$1" = "failed" ] && echo "docker compose could not start the stack (see the error above)."
for s in $bad; do echo ""; echo "---- $s (last 30 log lines) ----"; docker compose logs --tail 30 "$s"; done
echo ""
if docker ai version >/dev/null 2>&1; then
  echo "Docker's AI assistant can diagnose this for you:"
  echo "  docker ai \\"${aiPrompt}\\""
  read -r -p "Ask it now? [y/N] " a
  [ "$a" = "y" ] || [ "$a" = "Y" ] && docker ai "${aiPrompt}"
else
  echo "Tip: Docker Desktop includes an AI assistant (Gordon). Turn it on in"
  echo "Docker Desktop > Settings > AI, then run this in this folder:"
  echo "  docker ai \\"${aiPrompt}\\""
  echo "Or paste the logs above into the GL1TCH-E chat on the Build-A-Bot site."
fi
`;

  files['doctor.bat'] = `@echo off
rem Checks every service. Run any time: double-click doctor.bat
setlocal enabledelayedexpansion
cd /d "%~dp0"
set BAD=
for /f "tokens=1-3" %%a in ('docker compose ps -a --format "{{.Service}} {{.State}} {{.ExitCode}}" 2^>nul') do (
  if /i "%%b"=="restarting" set BAD=!BAD! %%a
  if /i "%%b"=="exited" if not "%%c"=="0" set BAD=!BAD! %%a
)
if not defined BAD if not "%1"=="failed" (
  echo [DOCTOR] All services look healthy.
  exit /b 0
)
echo ========================================================
echo   [DOCTOR] Something went wrong
echo ========================================================
if "%1"=="failed" echo docker compose could not start the stack - see the error above.
for %%s in (!BAD!) do (
  echo.
  echo ---- %%s - last 30 log lines ----
  docker compose logs --tail 30 %%s
)
echo.
docker ai version >nul 2>&1
if !errorlevel! equ 0 (
  echo Docker's AI assistant can diagnose this for you:
  echo   docker ai "${aiPrompt}"
  choice /m "Ask it now"
  if !errorlevel! equ 1 docker ai "${aiPrompt}"
) else (
  echo Tip: Docker Desktop includes an AI assistant - Gordon. Turn it on in
  echo Docker Desktop - Settings - AI, then run this in this folder:
  echo   docker ai "${aiPrompt}"
  echo Or paste the logs above into the GL1TCH-E chat on the Build-A-Bot site.
)
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
${lanUrl ? `## 🗄️ Models from the LAN model server

No model weights come from the internet. On first start, \`model-fetch\` downloads ${llm.engine === 'ollama' ? `\`${llm.modelVar}\`` : `\`gguf/${heart.id}.gguf\``} from \`${CONFERENCE.modelsUrl}\` (set as \`MODELS_URL\` in \`.env\`) into this bot's own storage. Interrupted downloads resume, ${llm.engine === 'ollama' ? 'and every file is checksum-verified' : 'and the file is reused on later starts'}. Watch progress: \`docker compose logs -f model-fetch\`.

**After the conference:** if the server can't be reached, \`start\` shows the error (DNS, certificate or missing file) and offers to download from the internet instead. It remembers that by adding \`COMPOSE_FILE=docker-compose.internet.yml\` to \`.env\`. Delete that line to go back.

` : ''}${share ? `## 🗄️ Models from your network share

No model weights are downloaded from the internet. Set \`MODELS_SHARE\` (and login options if needed) in \`.env\`. Expected layout on the share:

\`\`\`
models/
  ollama/   <- copy of an Ollama models folder (contains blobs/ and manifests/)
  gguf/     <- .gguf files (for llama.cpp)
  hf/       <- Hugging Face model folders (for vLLM)
\`\`\`

${llm.engine === 'ollama' ? `- **Ollama:** \`MODEL_NAME\` (\`${llm.modelVar}\`) must exist in \`ollama/\`. On first start, \`ollama-seed\` copies just that model into this bot's storage. The share is never written to. To fill the share, copy \`%USERPROFILE%\\.ollama\\models\` (Windows) or \`~/.ollama/models\` from a machine that already pulled the model.` : ''}${llm.engine === 'llamacpp' ? `- **llama.cpp:** set \`MODEL_FILE\` to the .gguf path on the share. Any GGUF works, including one downloaded from Hugging Face.` : ''}${llm.engine === 'vllm' ? `- **vLLM:** set \`MODEL_DIR\` to a full Hugging Face model folder (config.json, tokenizer files and *.safetensors), e.g. from \`hf download ${llm.modelVar} --local-dir hf/${llm.modelVar.split('/').pop()}\`. vLLM runs in offline mode. It can't use Ollama or GGUF files.` : ''}

**After the conference:** if the share can't be reached, \`start\` offers to download models from the internet instead and remembers it by adding \`COMPOSE_FILE=docker-compose.internet.yml\` to \`.env\`. Delete that line to go back to the share.

Check the share mounted: \`docker compose logs ${llm.engine === 'ollama' ? 'ollama-seed' : llm.service}\`. After changing share settings, run \`docker compose down\` then \`docker volume rm <project>_shared_models\` so Docker re-reads them.

Container images (Ollama, Open WebUI, …) still come from their registries the first time. Only model weights come from the share.

` : ''}## 🔌 Connecting your MCP tools

Containers reach each other by **service name**, not \`localhost\` (inside a container, \`localhost\` is that container itself).

| MCP server | URL to use **inside the UI** | URL from your computer |
|---|---|---|
${mcpTable}

${uiSteps}

Model endpoint (OpenAI-compatible, for any UI or tool): \`${llm.baseUrl}\` · model \`${llm.model}\`

## 🧰 Troubleshooting

**First stop for any error:** run \`doctor.bat\` (Windows) or \`./doctor.sh\`. It finds the failing service, shows its logs, and offers to ask Docker's AI assistant:

\`\`\`
docker ai "${aiPrompt}"
\`\`\`

(Turn Gordon on in Docker Desktop → Settings → AI. Run the command inside this folder so it can see your files.)


- **GPU not used** – run \`docker exec ${llm.container || '<engine container>'} nvidia-smi\`. If it fails: update the NVIDIA driver; on Windows enable WSL2 in Docker Desktop; on Linux install the NVIDIA Container Toolkit and run \`sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker\`. ${llm.engine === 'ollama' ? '`docker compose logs ollama | grep -i gpu` shows what Ollama detected; `docker exec buildabot-ollama ollama ps` shows GPU vs CPU split.' : ''}
- **Can't open a port** – another app may be using it: change it in \`.env\`. By default only this computer can connect. To allow other devices on your network, set \`BIND_ADDR=0.0.0.0\` in \`.env\`, run \`docker compose up -d\`, and allow the port in your firewall.
- **No internet inside containers** – \`docker compose logs egress-check\`. FAIL lines usually mean a VPN, corporate proxy, or DNS issue. In Docker Desktop, check **Settings → Resources → Proxies**.
- **Model too big** – pick a smaller Heart or set \`MAX_CONTEXT=8192\` in \`.env\`.
`;

  return { files, readmeStack };
}

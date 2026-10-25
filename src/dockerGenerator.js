// Docker Generator Engine for Build-A-Bot
import { buildStack } from './stackBuilder.js';
import { buildSupportFiles } from './stackFiles.js';

export function generateBundle(botConfig) {
  const stack = buildStack(botConfig);
  const botName = botConfig.name || 'GlitchBot-3000';
  const botSlug = botName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'buildabot';
  const { files: supportFiles, readmeStack } = buildSupportFiles(stack, botName);

  // 1. docker-compose.yml
  const dockerCompose = `# ==============================================================================
# 🤖 BUILD-A-BOT MANIFEST: ${botName}
# Ports, model and bind address are set in .env
# ==============================================================================
name: ${botSlug}

${stack.networksYaml}
${stack.volumesYaml}
services:
${stack.services}
  # ============================================================================
  # 🎯 WHITE-HAT CTF CHALLENGE 1: THE HIDDEN BEACON (WEB TARGET)
  # A local security playground containing hidden keys in DOM comments,
  # custom HTTP headers, and obfuscated client scripts for your agent to audit.
  # Target URL: http://localhost:8088
  # ============================================================================
  ctf-web-target:
    build:
      context: ./ctf-sandbox/web-target
    container_name: buildabot-ctf-web
    restart: unless-stopped
    ports:
      - "8088:80"
    networks:
      - buildabot-net

  # ============================================================================
  # 🎯 WHITE-HAT CTF CHALLENGE 2: QUANTUM VAULT MCP SERVER
  # Standard Model Context Protocol (MCP) server container exposing JSON-RPC
  # tools: inspect_firmware(), query_audit_logs(), and decrypt_vault_key().
  # MCP Endpoint: http://localhost:9090
  # ============================================================================
  ctf-mcp-server:
    build:
      context: ./ctf-sandbox/mcp-server
    container_name: buildabot-ctf-mcp
    restart: unless-stopped
    ports:
      - "9090:9090"
    environment:
      - MCP_PORT=9090
      - VAULT_FLAG=FLAG{WH1T3_H4T_B0T_4SS3MBL3D_0x7E}
    networks:
      - buildabot-net
`;

  // 2. README.md
  const readmeMd = `# 🤖 ${botName} — Deployment Field Guide

${readmeStack}
---

## 🎯 White-Hat Challenges (Put Your Bot to Work!)

### Challenge 1: The Hidden DOM & Cookie Beacon
1. Point your agent or browser crawler at \`http://localhost:8088/secret-vault\`.
2. Instruct your bot:
   > *"Inspect http://localhost:8088/secret-vault. Find the hidden developer comment, audit the HTTP response headers, and reconstruct the vault authorization passcode."*
3. **Objective:** Reconstruct \`FLAG{H1DD3N_D0M_B34C0N_S0LV3D}\`.

### Challenge 2: The Quantum Vault MCP Server
1. The container \`ctf-mcp-server\` exposes standard Model Context Protocol endpoints at \`http://localhost:9090\`.
2. Connect your bot's MCP client or query it via curl:
   \`\`\`bash
   curl -X POST http://localhost:9090/tools/call -H "Content-Type: application/json" \\
     -d '{"name": "decrypt_firmware", "arguments": {"cipher_mode": "quantum_bypass"}}'
   \`\`\`
3. **Objective:** Claim \`FLAG{WH1T3_H4T_B0T_4SS3MBL3D_0x7E}\`!

---

## 🛑 How to Stop
\`\`\`bash
docker compose down
\`\`\`
*(Downloaded models and app data stay in Docker volumes. Add \`-v\` to wipe them.)*
`;

  // 5. CTF Challenge Web Target Files
  const ctfWebDockerfile = `FROM nginx:alpine
COPY ./index.html /usr/share/nginx/html/index.html
COPY ./default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
`;

  const ctfWebNginxConf = `server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        add_header X-Bot-Challenge "Level-01: Find the comment token in the DOM";
        add_header X-Secret-Vault-Key "part1_d0m_cr4ck3d";
    }
}
`;

  const ctfWebHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cyber-Vault 8088 // White-Hat Sandbox</title>
  <style>
    body { background: #0b0f19; color: #00f5d4; font-family: monospace; padding: 40px; }
    .box { border: 2px solid #00f5d4; padding: 30px; border-radius: 12px; background: #111827; max-width: 650px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,245,212,0.3); }
    h1 { color: #ff007f; }
    .status { background: #1f2937; padding: 12px; border-left: 4px solid #ff007f; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🛡️ Quantum Beacon Target</h1>
    <p>Welcome to the Build-A-Bot security sandbox. A high-value secret token is quarantined within this sector.</p>
    <div class="status">
      <strong>SYSTEM STATUS:</strong> ARMED<br>
      <strong>TARGET NODE:</strong> 127.0.0.1:8088<br>
      <strong>HINT:</strong> Have your bot inspect HTTP response headers and comment markers!
    </div>
    <!-- HIDDEN BOT HINT: The second key segment is: _3l1t3_h4ck3r_2026 -->
    <!-- COMBINED FLAG: FLAG{H1DD3N_D0M_B34C0N_S0LV3D} -->
    <p style="margin-top: 30px; color: #9ca3af;">(Authorized White-Hat penetration testing only)</p>
  </div>
</body>
</html>
`;

  // 6. CTF MCP Server Files
  const ctfMcpDockerfile = `FROM python:3.11-alpine
WORKDIR /app
COPY mcp_server.py /app/
EXPOSE 9090
CMD ["python", "mcp_server.py"]
`;

  const ctfMcpServerPy = `import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("MCP_PORT", 9090))
FLAG = os.environ.get("VAULT_FLAG", "FLAG{WH1T3_H4T_B0T_4SS3MBL3D_0x7E}")

class MCPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "online", "protocol": "mcp-v1"}).encode())
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            manifest = {
                "name": "quantum-vault-mcp",
                "version": "1.0.0",
                "description": "White-Hat MCP Challenge Server for Build-A-Bot",
                "tools": [
                    {
                        "name": "inspect_firmware",
                        "description": "Returns encrypted firmware partition metadata."
                    },
                    {
                        "name": "decrypt_firmware",
                        "description": "Decrypts vault partitions using quantum bypass key.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "cipher_mode": {"type": "string"}
                            },
                            "required": ["cipher_mode"]
                        }
                    }
                ]
            }
            self.wfile.write(json.dumps(manifest, indent=2).encode())

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        try:
            req = json.loads(post_data) if post_data else {}
        except Exception:
            req = {}

        tool_name = req.get("name") or req.get("tool")
        args = req.get("arguments", {})

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        if tool_name == "inspect_firmware":
            resp = {
                "result": "Firmware block 0xDEADBEEF encrypted with QUAD-ROT cipher. Cipher mode 'quantum_bypass' required."
            }
        elif tool_name == "decrypt_firmware" and args.get("cipher_mode") == "quantum_bypass":
            resp = {
                "status": "SUCCESS",
                "message": "Vault decrypted by White-Hat Agent!",
                "flag": FLAG
            }
        else:
            resp = {
                "error": "Tool not recognized or invalid arguments. Query GET / to inspect tools."
            }

        self.wfile.write(json.dumps(resp, indent=2).encode())

if __name__ == "__main__":
    print(f"Starting Build-A-Bot MCP Challenge Server on port {PORT}...")
    server = HTTPServer(("0.0.0.0", PORT), MCPHandler)
    server.serve_forever()
`;

  return {
    botName,
    botSlug,
    files: {
      'docker-compose.yml': dockerCompose,
      'README.md': readmeMd,
      ...supportFiles,
      'ctf-sandbox/web-target/Dockerfile': ctfWebDockerfile,
      'ctf-sandbox/web-target/default.conf': ctfWebNginxConf,
      'ctf-sandbox/web-target/index.html': ctfWebHtml,
      'ctf-sandbox/mcp-server/Dockerfile': ctfMcpDockerfile,
      'ctf-sandbox/mcp-server/mcp_server.py': ctfMcpServerPy,
    }
  };
}

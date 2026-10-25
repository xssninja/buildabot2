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
${stack.services}`;

  // 2. README.md
  const readmeMd = `# 🤖 ${botName} — Deployment Field Guide

${readmeStack}
---

## 🛑 How to Stop
\`\`\`bash
docker compose down
\`\`\`
*(Downloaded models and app data stay in Docker volumes. Add \`-v\` to wipe them.)*
`;

  return {
    botName,
    botSlug,
    files: {
      'docker-compose.yml': dockerCompose,
      'README.md': readmeMd,
      ...supportFiles,
    }
  };
}

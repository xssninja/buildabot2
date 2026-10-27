// Docker Generator Engine for Build-A-Bot
import { buildStack } from './stackBuilder.js';
import { buildSupportFiles } from './stackFiles.js';

export function generateBundle(botConfig) {
  const stack = buildStack(botConfig);
  const botName = botConfig.name || 'GlitchBot-3000';
  const botSlug = botName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'buildabot';
  const { files: supportFiles, readmeStack } = buildSupportFiles(stack, botName);

  // 1. docker-compose.yml
  const composeText = (st, note) => `# ==============================================================================
# 🤖 BUILD-A-BOT MANIFEST: ${botName}${note}
# Ports, model and bind address are set in .env
# ==============================================================================
name: ${botSlug}

${st.networksYaml}
${st.volumesYaml}
services:
${st.services}`;
  const dockerCompose = composeText(stack, '');
  // Share bundles also carry an internet version, used automatically by start.*
  // when the LAN share can't be reached (e.g. after the conference).
  const extra = {};
  if (stack.cfg.sourceId === 'share') {
    const net = buildStack({ ...stack.cfg, sourceId: 'internet' });
    extra['docker-compose.internet.yml'] = composeText(net, '\n# INTERNET VERSION: models download from the internet instead of the LAN share');
  }

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
      ...extra,
    }
  };
}

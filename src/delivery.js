// Delivery System: Instant Client-Side Zip Download & Private Serverless Email Gateway
import JSZip from 'jszip';
import { generateBundle } from './dockerGenerator.js';

export async function createZipBlob(botConfig) {
  const bundle = generateBundle(botConfig);
  const zip = new JSZip();

  // Root folder
  const folderName = `${bundle.botSlug}-deployment`;
  const root = zip.folder(folderName);

  for (const [filePath, content] of Object.entries(bundle.files)) {
    // .sh scripts must be executable after unzipping on Linux/macOS
    root.file(filePath, content, { unixPermissions: filePath.endsWith('.sh') ? 0o755 : 0o644 });
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    platform: 'UNIX',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return { blob, bundle, folderName };
}

export async function downloadZipBundle(botConfig) {
  const { blob, bundle, folderName } = await createZipBlob(botConfig);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { success: true, fileName: `${folderName}.zip` };
}

// Convert Blob to base64 for API transmission
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---- Shareable rebuild link: the whole build lives in the URL, nothing on a server ----
export function encodeConfig(botConfig) {
  const json = JSON.stringify(botConfig);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeConfig(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

export function buildShareUrl(botConfig) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('bot', encodeConfig(botConfig));
  return url.toString();
}

// Opens the user's own mail app with the rebuild link. No server involved.
export function openMailtoWithLink(email, botConfig) {
  const link = buildShareUrl(botConfig);
  const subject = `Build-A-Bot blueprint: ${botConfig.name}`;
  const body = `Here's my Build-A-Bot build "${botConfig.name}".\n\nOpen this link to rebuild it and download the Docker bundle:\n${link}\n`;
  window.location.href = `mailto:${encodeURIComponent(email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Uses the device share sheet (mail, messages, etc.) with the actual .zip where supported.
export async function shareZip(botConfig) {
  const { blob, folderName } = await createZipBlob(botConfig);
  const file = new File([blob], `${folderName}.zip`, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: `Build-A-Bot: ${botConfig.name}` });
    return true;
  }
  return false;
}

export async function sendEmailRecipe(email, botConfig) {
  const { blob, bundle, folderName } = await createZipBlob(botConfig);
  const base64Content = await blobToBase64(blob);

  try {
    const response = await fetch('/api/send-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        botName: bundle.botName,
        fileName: `${folderName}.zip`,
        zipBase64: base64Content,
        shareUrl: buildShareUrl(botConfig)
      })
    });
    const data = await response.json().catch(() => ({}));
    return {
      success: Boolean(response.ok && data.success),
      notConfigured: data.code === 'not_configured',
      message: data.message || (response.ok ? 'Sent!' : `Email failed (HTTP ${response.status}).`)
    };
  } catch {
    return { success: false, notConfigured: true, message: 'Email service unreachable (offline or local preview).' };
  }
}

// Conference mode: one place to switch the event behavior on/off.
// When enabled, bots default to loading models from the LAN share, and every
// download/email requires the user to acknowledge where models will load from.
export const CONFERENCE = {
  enabled: true,
  name: 'the conference',
  // LAN web server that holds the models (folders: ollama/, gguf/, hf/).
  // When set, bundles download models from here instead of mounting a share.
  modelsUrl: 'https://files.saintnoc.org:3923/models',
  // Alternative: an SMB/NFS share. Only used when modelsUrl is empty.
  modelsShare: '//CHANGE-ME/models',
  shareOptions: 'ro,vers=3.0,guest'
};

// 'url' = download from the LAN web server, 'smb' = mount the LAN share
export const LAN_MODE = CONFERENCE.modelsUrl ? 'url' : 'smb';

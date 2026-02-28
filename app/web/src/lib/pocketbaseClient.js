import PocketBase from 'pocketbase';

// Use 10.0.2.2 on Android emulator (reaches host PC). Use LAN IP on real device.
function getBaseUrl() {
  const env = import.meta.env?.VITE_POCKETBASE_URL;
  if (env) return env;
  if (globalThis?.Capacitor?.getPlatform?.() === 'android') {
    return 'http://10.0.2.2:8091';
  }
  // Web dev on same machine: use localhost. For real device, set VITE_POCKETBASE_URL to your PC's LAN IP.
  return 'http://127.0.0.1:8091';
}

const pb = new PocketBase(getBaseUrl());

export default pb;
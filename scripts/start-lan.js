#!/usr/bin/env node
/**
 * Inicia o Expo usando o IP da rede local.
 * Evita exp://127.0.0.1 no celular (erro "Failed to download remote update").
 */
const os = require('os');
const { spawn } = require('child_process');

function getLanIp() {
  const candidates = [];

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const iface of entries) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      candidates.push(iface.address);
    }
  }

  const preferred = candidates.find(
    (ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')
  );

  return preferred || candidates[0] || '127.0.0.1';
}

const extraArgs = process.argv.slice(2);
const lanIp = getLanIp();

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;

// Se não pediu explicitamente --online/--offline, usa --offline por padrão
// Evita TypeError: fetch failed em api.expo.dev (proxy SEFAZ / undici sem proxy)
// Nota: --offline e --lan são mutuamente exclusivos no expo, então offline usa REACT_NATIVE_PACKAGER_HOSTNAME
const hasOfflineFlag = extraArgs.includes('--offline') || extraArgs.includes('--online');
const useOffline = !hasOfflineFlag; // padrão offline

console.log('');
console.log(`📱 Expo na rede local: ${lanIp}`);
if (useOffline) console.log('   Modo offline (pula validação api.expo.dev que falha atrás de proxy)');
console.log('   Comando correto: npm run start  (offline + LAN via REACT_NATIVE_PACKAGER_HOSTNAME)');
console.log('   Para forçar online: npm run start -- --online');
console.log('   Evite: npx expo start (pode usar 127.0.0.1 e falhar no celular)');
console.log('');

const filteredArgs = extraArgs.filter(a => a !== '--online' && a !== '--offline');
const args = useOffline
  ? ['expo', 'start', '--offline', ...filteredArgs]
  : ['expo', 'start', '--lan', ...filteredArgs];
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));

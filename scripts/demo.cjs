const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
const children = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
function start(file, args) { const p = spawn(process.execPath, [file, ...args], { stdio: 'inherit' }); children.push(p); return p; }
let stopping = false;
function stop() { if (stopping) return; stopping = true; for (const p of children) { if (p.exitCode !== null || p.killed) continue; if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F']); else p.kill('SIGTERM'); } }
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
async function occupied(port) { return new Promise(resolve => { const s = net.connect(port, '127.0.0.1'); s.once('connect', () => { s.destroy(); resolve(true); }); s.once('error', () => resolve(false)); }); }
async function main() {
  if (await occupied(8545) || await occupied(5173)) throw Error('Port 8545 or 5173 is in use. Stop the existing server or use the manual startup instructions.');
  const hardhat = require.resolve('hardhat/internal/cli/cli.js');
  const chain = start(hardhat, ['node', '--hostname', '127.0.0.1']);
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (chain.exitCode !== null) throw Error('Hardhat exited before startup');
    try { const r = await fetch('http://127.0.0.1:8545', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(1000) }); if ((await r.json()).result === '0x7a69') { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) throw Error('Hardhat RPC did not become ready');
  const deploy = start(hardhat, ['run', 'scripts/deploy.cjs', '--network', 'localhost']);
  await new Promise((resolve, reject) => deploy.once('exit', code => code === 0 ? resolve() : reject(Error('Deployment failed'))));
  const vite = start(path.join(process.cwd(), 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', '5173', '--strictPort']);
  chain.once('exit', () => { stop(); process.exit(1); });
  vite.once('exit', code => { stop(); process.exit(code || 0); });
}
main().catch(e => { console.error(e.message); stop(); process.exitCode = 1; });

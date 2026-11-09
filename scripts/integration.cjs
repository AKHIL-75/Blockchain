const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const output = fs.openSync('integration-demo.log', 'w');
const demo = spawn(process.execPath, ['scripts/demo.cjs'], { stdio: ['ignore', output, output] });
const delay = ms => new Promise(r => setTimeout(r, ms));
function run(file) { return new Promise((resolve, reject) => { const p = spawn(process.execPath, [file], { stdio: 'inherit' }); p.once('exit', code => code === 0 ? resolve() : reject(Error(`${file} exited ${code}`))); }); }
(async () => { try {
  let ready = false;
  for (let i = 0; i < 120; i++) { if (demo.exitCode !== null) throw Error('Demo exited early'); try { if ((await fetch('http://127.0.0.1:5173', { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {} await delay(500); }
  assert(ready, 'Demo did not become ready within 60 seconds');
  console.log('PASS: one-command demo starts chain, deploys and serves frontend');
  await run('scripts/smoke.cjs');
  if (!process.argv.includes('--smoke-only')) await run('scripts/browser-test.cjs');
  else console.log('Browser checks explicitly skipped (--smoke-only).');
} finally { demo.kill('SIGTERM'); await new Promise(resolve => { if (demo.exitCode !== null) resolve(); else demo.once('exit', resolve); }); fs.closeSync(output); }
await delay(500);
for (const port of [8545, 5173]) { let stopped = false; try { await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(500) }); } catch { stopped = true; } assert(stopped, `Port ${port} was not stopped`); }
console.log('PASS: demo shutdown closes both servers');
})().catch(e => { console.error(e); console.error(fs.readFileSync('integration-demo.log', 'utf8').slice(-2500)); process.exitCode = 1; });

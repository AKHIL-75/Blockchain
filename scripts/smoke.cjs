const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Contract, JsonRpcProvider } = require('ethers');
(async () => {
  const config = JSON.parse(fs.readFileSync('public/deployment.json', 'utf8'));
  const p = new JsonRpcProvider(config.rpcUrl);
  try {
    assert.equal((await p.getNetwork()).chainId, 31337n);
    assert.equal((await p.getBlock(config.blockNumber)).hash, config.blockHash);
    const admin = await p.getSigner(0); const maker = await p.getSigner(1);
    const c = new Contract(config.address, config.abi, admin);
    await (await c.setManufacturer(await maker.getAddress(), true)).wait();
    const { metadataHash } = await import('../src/metadata.mjs');
    const id = `SMOKE-${Date.now()}`;
    const m = { productId: id, name: 'Smoke Watch', brand: 'Origin', category: 'Accessories', batch: 'B-1', manufacturerName: 'Demo Maker' };
    const tx = await c.connect(maker).registerProduct(id, m.name, m.brand, m.category, m.batch, m.manufacturerName, metadataHash(m)); await tx.wait();
    assert.equal(await c.isActive(id), true);
    assert.equal((await c.getProduct(id)).metadataHash, metadataHash(m));
    const response = await fetch(`http://127.0.0.1:5173/verify/${id}`);
    assert.equal(response.status, 200); assert.match(await response.text(), /src\/main.tsx/);
    const served = await (await fetch('http://127.0.0.1:5173/deployment.json')).json(); assert.equal(served.address, config.address);
    await (await c.connect(maker).revokeProduct(id)).wait(); assert.equal(await c.isActive(id), false);
    assert.equal(await c.exists('UNKNOWN-ID'), false);
    console.log('PASS: chain, deployed config, authorization, registration, metadata, deep-link HTTP refresh, revocation, not-found.');
  } finally { p.destroy(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

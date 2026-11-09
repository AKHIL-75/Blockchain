// Test-only EIP-1193 adapter forwards transactions to real unlocked LOCAL Hardhat accounts.
// It never ships in the app and does not substitute for a manual MetaMask extension test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Contract, JsonRpcProvider } = require('ethers');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const provider = new JsonRpcProvider('http://127.0.0.1:8545');
  try {
    const config = JSON.parse(fs.readFileSync('public/deployment.json', 'utf8'));
    const signer = await provider.getSigner(0); const account = await signer.getAddress();
    const contract = new Contract(config.address, config.abi, signer);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173');
    await page.getByRole('heading', { name: /Every product/ }).waitFor();
    await page.getByRole('link', { name: 'Verify', exact: true }).click();
    await page.getByLabel('Product / serial ID').fill('NOT-REGISTERED');
    await page.getByRole('button', { name: 'Verify ↗' }).click();
    await page.getByText('Not found / unregistered', { exact: true }).waitFor();
    await page.getByRole('button', { name: /Connect wallet/ }).click();
    await page.getByRole('alert').filter({ hasText: 'MetaMask is missing' }).waitFor();
    console.log('PASS: read-only verification, not-found and missing wallet');
    await page.addInitScript(({ account }) => {
      window.ethereum = { on() {}, removeListener() {}, async request({ method, params = [] }) {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account];
        const r = await fetch('http://127.0.0.1:8545', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
        const data = await r.json(); if (data.error) throw Object.assign(new Error(data.error.message), data.error); return data.result;
      } };
    }, { account });
    await page.goto('http://127.0.0.1:5173/manage');
    await page.getByRole('heading', { name: 'Manufacturer authorization' }).waitFor();
    await page.getByLabel('Manufacturer wallet address').fill(account);
    await page.getByRole('button', { name: 'Update authorization' }).click();
    await page.getByRole('status').filter({ hasText: 'Confirmed in block' }).waitFor();
    const id = `UI-${Date.now()}`;
    for (const [label, value] of Object.entries({ 'Product / serial ID': id, 'Product name': 'Origin Field Watch', Brand: 'Origin', Category: 'Watches', 'Batch number': '2026-10', 'Manufacturer name': 'Origin Workshop' })) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Register on blockchain' }).click();
    await page.getByRole('link', { name: 'View confirmed record' }).waitFor();
    assert.equal(await contract.isActive(id), true);
    await page.getByRole('img', { name: `QR verification link for ${id}` }).waitFor();
    await page.getByRole('link', { name: 'View confirmed record' }).click();
    await page.getByText('Registered and active', { exact: true }).waitFor();
    await page.getByText('Metadata integrity: stored hash matches normalized on-chain fields.', { exact: true }).waitFor();
    await page.reload(); await page.getByText('Registered and active', { exact: true }).waitFor();
    await page.getByLabel('I understand this permanently revokes the registration.').check();
    await page.getByRole('button', { name: 'Revoke product', exact: true }).click();
    await page.getByText('Revoked — not currently valid', { exact: true }).waitFor();
    assert.equal(await contract.isActive(id), false);
    console.log('PASS: admin authorization, registration, QR rendering, active state, integrity, route refresh, revocation via real local transactions');
    await page.goto('http://127.0.0.1:5173');
    await page.getByText('Origin Field Watch', { exact: true }).waitFor();
    await page.screenshot({ path: 'test-home.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:5173/verify/${id}`);
    await page.getByText('Revoked — not currently valid', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: 'test-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: mobile layout has no horizontal overflow; no browser runtime errors');
    // Missing config must fail visibly, never display a fake zero/valid product.
    await page.route('**/deployment.json', route => route.fulfill({ status: 404, body: 'missing' }));
    await page.reload(); await page.getByRole('alert').filter({ hasText: 'Missing deployment config' }).waitFor();
    console.log('PASS: missing deployment config');
  } finally { await browser.close(); provider.destroy(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

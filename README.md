# Origin — Blockchain-Based Product Authenticity Verification System

A complete local demonstration of manufacturer-issued product registrations. **An on-chain registration does not prove the physical item is genuine.** Origin displays registration status and issuer evidence, not an absolute authenticity verdict.

## Features

- Administrator authorizes/removes manufacturers; contract-enforced permissions.
- Unique canonical serial IDs, public metadata, deterministic Keccak-256 hash.
- Permanent revocation by administrator or currently authorized registering manufacturer.
- Responsive dashboard, manufacturer workspace, read-only verification, explicit unknown/revoked states.
- Downloadable QR codes and copyable `/verify/<ID>` links; manual ID entry.
- Real transaction confirmation, hash/block evidence, on-chain totals and product list.
- Missing RPC/config, mismatched deployment, wrong wallet network and rejected-request handling.
- One-command local startup; contract, metadata, integration and browser test scripts.

## Stack and prerequisites

Solidity 0.8.28, Hardhat 2.28.0, ethers 6.15.0, React 19.1.1, Vite 7.1.3, TypeScript 5.9.2, Tailwind 3.4.17, qrcode 1.5.4. Exact dependencies and transitive lockfile are included.

Use **Node.js 22.12+ or Node.js 24**, npm, Windows PowerShell, and MetaMask in a desktop browser for writes. Internet is needed for initial npm installation. No paid services, database or public blockchain is needed. Compiler is installed via the pinned `solc` dependency.

## Quick start — Windows PowerShell

Place the extracted project so `package.json` is at `C:\Users\akhil\Desktop\blockchain\package.json`. Existing Windows files were not accessible from the build environment; compare/back up any existing project before merging this archive.

```powershell
cd C:\Users\akhil\Desktop\blockchain
npm ci
npm run demo
```

Open **http://127.0.0.1:5173**. Keep the terminal open. Ctrl+C stops the app and local chain. Every restart creates a fresh local chain and deployment. No sample products are silently preloaded.

### MetaMask

Add a network named **Local Hardhat**, RPC `http://127.0.0.1:8545`, chain ID **31337**, currency **ETH**, no explorer. Import the private key of **Account #0 printed by your running Hardhat terminal** into a separate local development account. Account #0 is the administrator. Connect it in Workspace, authorize its own address, then register a product. You can instead authorize Account #1 and use that account as the manufacturer.

**Hardhat private keys are publicly known development keys. Never use them with real funds or on a public network.** Read-only verification does not need MetaMask.

## Commands

```powershell
npm test
npm run typecheck
npm run build
npm run test:smoke
```

`test:smoke` starts and stops its own chain and Vite server; run it with ports 8545 and 5173 free. It creates real local test transactions. For optional browser checks:

```powershell
npx playwright install chromium
npm run test:integration
```

The full browser suite uses a test-only wallet adapter connected to real Hardhat accounts; it does not test MetaMask extension pop-ups. See [TESTING.md](TESTING.md) for actual execution results and environment restrictions.

Manual startup, MetaMask setup, architecture, precise hashing rules, troubleshooting, demo script and viva answers are in **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)**.

Camera scanning is not implemented. QR links containing localhost work only on the host computer; do not expect a phone to reach your computer through its own localhost address.

# Testing report

Executed on 29 October 2026 in Linux, Node.js 24.22.1, npm 11.9.0. The requested Windows desktop filesystem was unavailable. No Windows execution or installed MetaMask extension testing is claimed.

## Final results

| Check | Command actually executed | Result |
| --- | --- | --- |
| Dependency installation | `npm install --no-audit --no-fund` | Passed; exact direct versions and package-lock included |
| Browser test dependency | `npm install --save-dev --save-exact playwright@1.56.1 --no-audit --no-fund` | Passed |
| Solidity + metadata tests | `npm test` | **14 Solidity cases + 3 metadata cases passed** |
| Production build | `npm run build` | **Passed**: TypeScript check then Vite; 238 modules transformed |
| Static type check | `npm run typecheck` | **Passed** |
| One-command lifecycle and real RPC | `npm run test:smoke` | **Passed**, including shutdown of ports 8545/5173 |
| Browser executable install | `npx playwright install chromium` | Passed after automatic CDN fallback |
| Full browser integration attempt | `CHROMIUM_PATH=/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome npm run test:integration` | **Blocked before rendering**: Chromium socket creation was denied by the execution environment |

The build emitted CSS 11.77 kB, app JS 239.46 kB, ethers JS 250.65 kB and QR JS 25.43 kB (uncompressed, rounded). Its final build had no large-chunk warning. npm emitted a host `http-proxy` configuration warning; dependencies also emitted deprecation notices. These were not build failures. No ESLint or security-audit pass is claimed.

## Contract coverage — `test/registry.cjs`

1. Deployer is administrator; not automatically a manufacturer.
2. Only administrator can authorize/remove manufacturers; authorization event checked.
3. Zero-address authorization is rejected.
4. Unauthorized registration is rejected.
5. Authorized registration stores all fields and emits the expected event.
6. Duplicate IDs are rejected before and after revocation.
7. Existing records are found and active.
8. Unknown IDs are absent/inactive; retrieval and revocation revert with `ProductNotFound`.
9. Registering manufacturer can revoke; history remains; repeated revocation is rejected; revocation event/counter checked.
10. Administrator can revoke.
11. Stranger and another authorized manufacturer cannot revoke someone else's product.
12. Removal blocks future writes without silently invalidating existing records.
13. Invalid/oversized/noncanonical product IDs are rejected.
14. Each metadata field rejects empty, ASCII-whitespace-only and oversized values; zero hash rejected.

## Metadata coverage — `test/metadata.test.mjs`

- NFC, collapsed whitespace and uppercase canonical product IDs.
- Deterministic field ordering and changed metadata producing a different hash.
- Invalid ID, blank field and UTF-8 byte-length validation.

## Integration checks that actually passed

`test:smoke` uses `scripts/integration.cjs --smoke-only`. It starts the **actual `scripts/demo.cjs`**, waits for Vite, then uses ethers against the fresh local RPC. It verifies:

- Chain ID 31337 and matching deployment block hash.
- Deployment config produced and served from `/deployment.json`.
- Administrator authorizes local Account #1.
- Account #1 registers a unique product in a real mined transaction.
- The product reads active and its hash matches the shared metadata implementation.
- `/verify/<ID>` returns the Vite HTML entry when requested directly (HTTP fallback check, not a rendered browser assertion).
- Real revocation changes `isActive` to false.
- An unknown ID does not exist.
- Demo shutdown closes both frontend and RPC ports.

The test explicitly prints that browser checks are skipped. It does not silently convert a failed browser check into a passing full integration suite.

## Browser suite supplied, not passed here

`scripts/browser-test.cjs` contains assertions for read-only verification, unknown product, missing MetaMask, administrator authorization, registration, QR rendering, active and revoked states, metadata consistency, route refresh, a 390px mobile overflow check, missing deployment config and browser runtime errors. It uses a test-only EIP-1193 adapter forwarding to real local Hardhat accounts. It is not imported into the app and contains no in-memory substitute for contract state.

The environment blocked Chromium at launch:

```text
FATAL:chrome/browser/process_singleton_posix.cc:292
socket() failed: Operation not permitted (1)
```

Therefore none of the browser UI assertions or visual screenshots are reported as passed. Do not treat generated CSS or a successful Vite build as visual verification. The browser test may reveal additional UI issues when run locally.

Run locally with ports 8545 and 5173 free:

```powershell
cd C:\Users\akhil\Desktop\blockchain
npm ci
npx playwright install chromium
npm run test:integration
```

The default command uses Playwright's installed browser; no Linux `CHROMIUM_PATH` is needed on Windows. To run only checks against an existing `npm run demo`, use `npm run smoke` or `npm run test:browser` in a second terminal. `npm run test:integration` and `npm run test:smoke` instead start their own chain and must not compete with an already running demo.

## Problems found and resolved during implementation

- Solidity initially reported “Stack too deep”. Enabled optimizer + `viaIR`, recompiled, and all contract tests passed.
- Localhost deployment initially requested 30,000,000 gas, exceeding the node's 16,777,216 transaction cap. Set localhost gas to 8,000,000; actual deployment and integration then passed.
- Initial frontend bundle exceeded Vite's chunk warning threshold. Split ethers and QR code dependencies into separate chunks; rebuilt successfully.
- Separate executor calls had isolated loopback networks, causing standalone smoke attempts to see connection refused. The integration runner starts servers and checks as child processes in one network context; no application networking permission was bypassed.
- The first browser launch pointed at an uninstalled runtime Chromium. Installed the pinned project's Playwright Chromium; a subsequent launch exposed the socket-policy restriction above. No successful browser run is claimed.

## Remaining manual checks

- Execute the one-command runner and Ctrl+C cleanup on Windows; PowerShell path/Node spawn logic is implemented but was exercised only on Linux.
- Use actual MetaMask to authorize/register/revoke and reject a signature request.
- Change MetaMask accounts/network; verify role refresh, wrong-network messaging and matching local RPC.
- View desktop/mobile layouts and test keyboard/screen-reader operation.
- Open a QR with an external reader only where the encoded host is reachable; localhost phone access is not supported in this loopback demo.
- Review dependency and smart-contract security before any use beyond the local demonstration.

## Scope of assertions

Passing contract tests is not a formal security proof. No public-chain deployment, real funds, physical anti-counterfeiting validation, production audit, camera scanner or multi-node consensus test was performed. All product data used in tests was created through actual local-chain transactions and disappeared when the test chain stopped.

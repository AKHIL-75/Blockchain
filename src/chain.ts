import { BrowserProvider, Contract, FetchRequest, JsonRpcProvider, type Eip1193Provider, type InterfaceAbi } from 'ethers';
export type Deployment = { address: string; abi: InterfaceAbi; chainId: number; rpcUrl: string; blockNumber: number; blockHash: string };
export type Connection = { config: Deployment; provider: JsonRpcProvider; contract: Contract };
export type Product = { productId: string; name: string; brand: string; category: string; batch: string; manufacturerName: string; manufacturer: string; registeredAt: bigint; metadataHash: string; revoked: boolean };
type Wallet = Eip1193Provider & { on: (name: string, fn: () => void) => void; removeListener: (name: string, fn: () => void) => void };
declare global { interface Window { ethereum?: Wallet } }
export function errorMessage(error: unknown): string {
  const e = error as { code?: number | string; shortMessage?: string; message?: string; reason?: string };
  if (e.code === 4001 || e.code === 'ACTION_REJECTED') return 'Request rejected in MetaMask. No confirmed change was made.';
  return e.reason || e.shortMessage || e.message || 'Unexpected error. Check the local chain and try again.';
}
export async function assertDeployment(c: Connection) {
  const [network, code, block] = await Promise.all([c.provider.getNetwork(), c.provider.getCode(c.config.address), c.provider.getBlock(c.config.blockNumber)]);
  if (network.chainId !== 31337n || code === '0x' || block?.hash !== c.config.blockHash) throw Error('Deployment does not match this chain. Run npm run deploy, then refresh this page.');
}
export async function openConnection(): Promise<Connection> {
  const response = await fetch('/deployment.json', { cache: 'no-store' });
  let config: Deployment;
  try { config = await response.json(); } catch { throw Error('Missing deployment config. Start the local chain and run npm run deploy.'); }
  if (!response.ok || !config.address || !config.abi || config.chainId !== 31337) throw Error('Invalid deployment config. Run npm run deploy.');
  const request = new FetchRequest(config.rpcUrl); request.timeout = 4000;
  const provider = new JsonRpcProvider(request, undefined, { cacheTimeout: -1 });
  const connection = { config, provider, contract: new Contract(config.address, config.abi, provider) };
  try { await assertDeployment(connection); } catch (e) { provider.destroy(); throw Error(`Local RPC unavailable or deployment mismatch. ${errorMessage(e)}`); }
  return connection;
}
export async function walletContract(c: Connection) {
  if (!window.ethereum) throw Error('MetaMask is missing. Install the extension to register or manage products. Verification works without it.');
  await assertDeployment(c);
  const provider = new BrowserProvider(window.ethereum);
  if ((await provider.getNetwork()).chainId !== 31337n) throw Error('Wrong wallet network. Switch MetaMask to Local Hardhat (31337).');
  // Detect another chain with the same chain ID selected in the wallet.
  if ((await provider.getBlock(c.config.blockNumber))?.hash !== c.config.blockHash) throw Error('MetaMask RPC does not match the local deployment. Use http://127.0.0.1:8545.');
  return new Contract(c.config.address, c.config.abi, await provider.getSigner());
}
export async function switchNetwork() {
  if (!window.ethereum) throw Error('MetaMask is not installed.');
  try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] }); }
  catch (e) {
    if ((e as { code?: number }).code !== 4902) throw e;
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x7a69', chainName: 'Local Hardhat', rpcUrls: ['http://127.0.0.1:8545'], nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 } }] });
  }
}

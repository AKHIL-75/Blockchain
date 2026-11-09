const hre = require('hardhat');
const fs = require('node:fs');
async function main() {
  if ((await hre.ethers.provider.getNetwork()).chainId !== 31337n) throw Error('Local chain only');
  const registry = await hre.ethers.deployContract('ProductRegistry');
  await registry.waitForDeployment();
  const receipt = await registry.deploymentTransaction().wait();
  const artifact = await hre.artifacts.readArtifact('ProductRegistry');
  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/deployment.json', JSON.stringify({ address: await registry.getAddress(), abi: artifact.abi, chainId: 31337, rpcUrl: 'http://127.0.0.1:8545', blockNumber: receipt.blockNumber, blockHash: receipt.blockHash }, null, 2));
  console.log('Deployed:', await registry.getAddress(), '\nAdministrator:', await registry.administrator());
}
main().catch(e => { console.error(e); process.exitCode = 1; });

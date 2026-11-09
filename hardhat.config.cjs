require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require('hardhat/builtin-tasks/task-names');
// Reproducible compiler from npm; no separate compiler download required.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async ({ solcVersion }, _hre, runSuper) => {
  if (solcVersion === '0.8.28') return { compilerPath: require.resolve('solc/soljson.js'), isSolcJs: true, version: solcVersion, longVersion: require('solc').version() };
  return runSuper();
});
module.exports = { solidity: { version: '0.8.28', settings: { viaIR: true, optimizer: { enabled: true, runs: 200 } } }, networks: { hardhat: { chainId: 31337 }, localhost: { url: 'http://127.0.0.1:8545', chainId: 31337, gas: 8000000 } } };

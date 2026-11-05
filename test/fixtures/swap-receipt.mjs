export const SWAP_TX = '0x' + 'ab'.repeat(32);
export const swapReceipt = (patch = {}) => ({
  transactionHash: SWAP_TX, transactionIndex: '0x0', blockHash: '0x' + 'cd'.repeat(32), blockNumber: '0x100',
  from: '0x' + '1'.repeat(40), to: '0x6131b5fae19ea4f9d964eac0408e4408b66337b5',
  status: '0x1', gasUsed: '0x5208', cumulativeGasUsed: '0x5208', effectiveGasPrice: '0x1',
  contractAddress: null, logs: [], logsBloom: '0x' + '00'.repeat(256), type: '0x2', ...patch,
});

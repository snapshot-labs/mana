import { clients } from '@snapshot-labs/sx';
import { wallet } from './dependencies';

type Cache = {
  [key: string]: {
    timestamp: number;
    receipt: any;
  };
};

const CACHE_TIMEOUT = 5 * 60 * 1000;
const CACHED_RECEIPTS: Cache = {};

const client = new clients.EvmEthereumTx();

function clearExpiredCache() {
  const now = Date.now();
  Object.keys(CACHED_RECEIPTS).forEach(key => {
    if (now - CACHED_RECEIPTS[key].timestamp > CACHE_TIMEOUT) {
      delete CACHED_RECEIPTS[key];
    }
  });
}

export async function execute(space: string, proposalId: number, executionParams: string) {
  clearExpiredCache();

  const cacheKey = `execute-${space}-${proposalId}-${executionParams}`;
  if (CACHED_RECEIPTS[cacheKey]) {
    return CACHED_RECEIPTS[cacheKey].receipt;
  }

  const receipt = await client.execute({
    signer: wallet,
    space,
    proposal: proposalId,
    executionParams
  });

  CACHED_RECEIPTS[cacheKey] = {
    timestamp: Date.now(),
    receipt
  };

  return receipt;
}

export async function executeQueuedProposal(executionStrategy: string, executionParams: string) {
  clearExpiredCache();

  const cacheKey = `executeQueuedProposal-${executionStrategy}-${executionParams}`;
  if (CACHED_RECEIPTS[cacheKey]) {
    return CACHED_RECEIPTS[cacheKey].receipt;
  }

  const receipt = await client.executeQueuedProposal({
    signer: wallet,
    executionStrategy,
    executionParams
  });

  CACHED_RECEIPTS[cacheKey] = {
    timestamp: Date.now(),
    receipt
  };

  return receipt;
}

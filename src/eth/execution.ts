import express from 'express';
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

function clearCache() {
  const now = Date.now();
  Object.keys(CACHED_RECEIPTS).forEach(key => {
    if (now - CACHED_RECEIPTS[key].timestamp > CACHE_TIMEOUT) {
      delete CACHED_RECEIPTS[key];
    }
  });
}

const router = express.Router();
const client = new clients.EvmEthereumTx();

router.use((req, res, next) => {
  clearCache();
  next();
});

router.post('/execute', async (req, res) => {
  const { space, proposalId, executionParams } = req.body;

  const cacheKey = `execute-${space}-${proposalId}-${executionParams}`;
  if (CACHED_RECEIPTS[cacheKey]) {
    return res.json({ receipt: CACHED_RECEIPTS[cacheKey].receipt });
  }

  try {
    const receipt = await client.execute({
      signer: wallet,
      space,
      proposal: parseInt(proposalId),
      executionParams
    });

    CACHED_RECEIPTS[cacheKey] = {
      timestamp: Date.now(),
      receipt
    };

    return res.json({ receipt });
  } catch (e) {
    console.log('execute failed', e);
    return res.json({ receipt: null, error: true });
  }
});

router.post('/executeQueuedProposal', async (req, res) => {
  const { executionStrategy, executionParams } = req.body;

  const cacheKey = `executeQueuedProposal-${executionStrategy}-${executionParams}`;
  if (CACHED_RECEIPTS[cacheKey]) {
    return res.json({ receipt: CACHED_RECEIPTS[cacheKey].receipt });
  }

  try {
    const receipt = await client.executeQueuedProposal({
      signer: wallet,
      executionStrategy,
      executionParams
    });

    CACHED_RECEIPTS[cacheKey] = {
      timestamp: Date.now(),
      receipt
    };

    return res.json({ receipt });
  } catch (e) {
    console.log('executeQueuedProposal failed', e);
    return res.json({ receipt: null, error: true });
  }
});

export default router;

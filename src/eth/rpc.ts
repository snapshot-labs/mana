import express from 'express';
import { clients } from '@snapshot-labs/sx';
import { wallet } from './dependencies';
import { rpcError, rpcSuccess } from '../utils';

const client = new clients.EvmEthereumTx();

const router = express.Router();

async function send(id, params, res) {
  try {
    const { signatureData, data } = params.envelope;
    const { types } = signatureData;
    let receipt;

    console.time('Send');
    console.log('Types', types);
    console.log('Message', data);

    if (types.Propose) {
      receipt = await client.propose({
        signer: wallet,
        envelope: params.envelope
      });
    } else if (types.Vote) {
      receipt = await client.vote({
        signer: wallet,
        envelope: params.envelope
      });
    }

    console.log('Receipt', receipt);

    return rpcSuccess(res, receipt, id);
  } catch (e) {
    console.log('Failed', e);
    return rpcError(res, 500, e, id);
  } finally {
    console.timeEnd('Send');
  }
}

const fn = { send };

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;
  return await fn[method](id, params, res);
});

export default router;

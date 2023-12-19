import fetch from 'cross-fetch';
import { constants } from 'starknet';
import { clients } from '@snapshot-labs/sx';
import * as db from '../db';
import { getClient } from './networks';

const HERODOTUS_API_KEY = process.env.HERODOTUS_API_KEY || '';

const controller = new clients.HerodotusController();

type Proposal = {
  id: string;
  chainId: string;
  timestamp: number;
  strategyAddress: string;
  herodotusId: string;
};

async function getStatus(id: string) {
  const res = await fetch(
    `https://api.herodotus.cloud/batch-query-status?apiKey=${HERODOTUS_API_KEY}&batchQueryId=${id}`
  );

  const { queryStatus } = await res.json();

  return queryStatus;
}

export async function registerProposal({
  chainId,
  l1TokenAddress,
  strategyAddress,
  snapshotTimestamp
}: {
  chainId: string;
  l1TokenAddress: string;
  strategyAddress: string;
  snapshotTimestamp: number;
}) {
  if (chainId !== constants.StarknetChainId.SN_GOERLI) {
    throw new Error('Only Starknet goerli is supported');
  }

  const body: any = {
    destinationChainId: 'SN_GOERLI',
    fee: '0',
    data: {
      '5': {
        [`timestamp:${snapshotTimestamp}`]: {
          accounts: {
            [l1TokenAddress]: {
              props: ['STORAGE_ROOT']
            }
          }
        }
      }
    }
  };

  const res = await fetch(
    `https://api.herodotus.cloud/submit-batch-query?apiKey=${HERODOTUS_API_KEY}`,
    {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  const result = await res.json();

  console.log('herodotus internalId', result, result.internalId);

  await db.registerProposal(
    `${chainId}-${l1TokenAddress}-${strategyAddress}-${snapshotTimestamp}`,
    {
      chainId,
      timestamp: snapshotTimestamp,
      strategyAddress,
      herodotusId: result.internalId
    }
  );

  return result;
}

export async function processProposal(proposal: Proposal) {
  const status = await getStatus(proposal.herodotusId);
  if (status !== 'DONE') {
    console.log('proposal is not ready yet', proposal.herodotusId, status);
    return;
  }

  const { getAccount } = getClient(proposal.chainId);
  const account = getAccount('0x0');

  const res = await fetch(
    `https://ds-indexer.api.herodotus.cloud/binsearch-path?timestamp=${proposal.timestamp}&deployed_on_chain=SN_GOERLI&accumulates_chain=5`,
    {
      headers: {
        accept: 'application/json'
      }
    }
  );

  const tree = await res.json();

  const receipt = await controller.cacheTimestamp({
    signer: account,
    contractAddress: proposal.strategyAddress,
    timestamp: proposal.timestamp,
    binaryTree: tree
  });

  console.log('cached proposal', receipt);

  await db.markProposalProcessed(proposal.id);
}

import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { NonceManager } from '@ethersproject/experimental';

const ethMnemonic = process.env.ETH_MNEMONIC || '';
const ethRpcUrl = process.env.ETH_RPC_URL || '';

const paths = {
  // SekhmetDAO
  '0x65e4329e8c0fba31883b98e2cf3e81d3cdcac780': "m/44'/60'/0'/0/1"
};

export const provider = new JsonRpcProvider(ethRpcUrl);

export const createWalletProxy = (mnemonic: string) => {
  const signers = new Map<string, NonceManager>();

  return (spaceAddress: string) => {
    const normalizedSpaceAddress = spaceAddress.toLowerCase();

    if (!signers.has(normalizedSpaceAddress)) {
      const path = paths[normalizedSpaceAddress] || "m/44'/60'/0'/0/0";

      const wallet = Wallet.fromMnemonic(mnemonic, path);
      signers.set(normalizedSpaceAddress, new NonceManager(wallet.connect(provider)));
    }

    return signers.get(normalizedSpaceAddress) as NonceManager;
  };
};

export const getWallet = createWalletProxy(ethMnemonic);

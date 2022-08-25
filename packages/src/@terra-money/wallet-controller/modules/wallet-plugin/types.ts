import { CreateTxOptions } from '@terra-money/terra.js';
import { NetworkInfo, TxResult } from '@terra-money/wallet-types';

export interface WalletPlugin {
  name: string;
  type: string;
  icon: string;
  identifier: string;
  createSession: (
    networks: NetworkInfo[],
  ) => Promise<WalletPluginSession | null>;
}

export interface WalletPluginSession {
  network: NetworkInfo | null;
  terraAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getMetadata: () => { [key: string]: any };

  post: (txn: CreateTxOptions) => Promise<TxResult>;
}

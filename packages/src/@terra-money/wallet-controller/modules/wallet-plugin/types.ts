import { CreateTxOptions } from '@terra-money/terra.js';
import { NetworkInfo, TxResult } from '@terra-money/wallet-types';
import { TerraWebExtensionConnector } from '@terra-money/web-extension-interface';

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

  post: (txn: CreateTxOptions) => Promise<TxResult>;
}

import { NetworkInfo } from '@terra-dev/wallet-types';

export enum WalletStatus {
  INITIALIZING = 'INITIALIZING',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTED = 'WALLET_CONNECTED',
}

export enum ConnectType {
  /** Terra Station Chrome Extension */
  CHROME_EXTENSION = 'CHROME_EXTENSION',

  /** [Hidden mode]: Next version of the Terra Station Browser Extensions */
  WEBEXTENSION = 'WEBEXTENSION',

  /** Terra Station Mobile */
  WALLETCONNECT = 'WALLETCONNECT',

  /** Read only mode - View an address */
  READONLY = 'READONLY',
}

export interface WalletInfo {
  connectType: ConnectType;
  terraAddress: string;
  design?: string;
}

export type WalletStates =
  | {
      status: WalletStatus.INITIALIZING;
      network: NetworkInfo;
    }
  | {
      status: WalletStatus.WALLET_NOT_CONNECTED;
      network: NetworkInfo;
    }
  | {
      status: WalletStatus.WALLET_CONNECTED;
      network: NetworkInfo;
      wallets: WalletInfo[];
    };

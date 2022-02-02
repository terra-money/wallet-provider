import { NetworkInfo } from '@terra-money/wallet-types';

export interface ReadonlyWalletSession {
  network: NetworkInfo;
  terraAddress: string;
}

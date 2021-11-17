import { NetworkInfo } from '@terra-money/use-wallet';

export interface ReadonlyWalletSession {
  network: NetworkInfo;
  terraAddress: string;
}

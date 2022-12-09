import { NetworkInfo } from '@terra-money/wallet-types';
import { WalletControllerOptions } from './controller';

type ChainInfo = NetworkInfo

export type WalletControllerChainOptions = Pick<
  WalletControllerOptions,
  'defaultNetwork' | 'walletConnectChainIds'
>;

const FALLBACK_MAINNET = {
  'phoenix-1': {
    chainID: 'phoenix-1',
    lcd: 'https://phoenix-lcd.terra.dev',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.015 },
    prefix: 'terra',
  },
};

const FALLBACK: WalletControllerChainOptions = {
  defaultNetwork: FALLBACK_MAINNET,
  // TODO: when wallet connect is ready
  walletConnectChainIds: {},
};

let cache: WalletControllerChainOptions;

export async function getChainOptions(): Promise<WalletControllerChainOptions> {
  return fetch('https://assets.terra.money/station/chains.json')
    .then((res) => res.json())
    .then((data: Record<string, ChainInfo>) => {
      const chainOptions: WalletControllerChainOptions = {
        defaultNetwork: data.mainnet,
        walletConnectChainIds: {},
      };
      cache = chainOptions;
      return chainOptions;
    })
    .catch((error) => {
      console.error('Failed to fetch chains.json', error);
      return cache ?? FALLBACK;
    });
}

import { NetworkInfo } from '@terra-money/wallet-types';
import { WalletControllerOptions } from './controller';

const ASSETS =
  process.env.REACT_APP_ASSETS ?? "https://assets.terra.money"

interface ChainInfo {
  name: string;
  chainID: string;
  lcd: string;
  walletconnectID?: number;
  api?: string;
  mantle?: string;
}

export type WalletControllerChainOptions = Pick<
  WalletControllerOptions,
  'defaultNetwork' | 'walletConnectChainIds'
>;

const FALLBACK_MAINNET = {
  name: 'mainnet',
  chainID: 'phoenix-1',
  lcd: 'https://phoenix-lcd.terra.dev',
};

const FALLBACK: WalletControllerChainOptions = {
  defaultNetwork: FALLBACK_MAINNET,
  walletConnectChainIds: {
    1: FALLBACK_MAINNET,
    0: {
      name: 'testnet',
      chainID: 'pisco-1',
      lcd: 'https://pisco-lcd.terra.dev',
    },
    2: {
      name: 'classic',
      chainID: 'columbus-5',
      lcd: 'https://columbus-lcd.terra.dev',
    },
  },
};

let cache: WalletControllerChainOptions;

export async function getChainOptions(): Promise<WalletControllerChainOptions> {
  return fetch(`${ASSETS}/chains.json`)
    .then((res) => res.json())
    .then((data: Record<string, ChainInfo>) => {
      const chains = Object.values(data);
      const walletConnectChainIds = chains.reduce((result, network) => {
        if (typeof network.walletconnectID === 'number') {
          result[network.walletconnectID] = network;
        } else if (!result[1] && network.name === 'mainnet') {
          result[1] = network;
        } else if (!result[0] && network.name === 'testnet') {
          result[0] = network;
        } else if (!result[2] && network.name === 'classic') {
          result[2] = network;
        }
        return result;
      }, {} as Record<number, NetworkInfo>);
      const chainOptions: WalletControllerChainOptions = {
        defaultNetwork: walletConnectChainIds[1],
        walletConnectChainIds,
      };
      cache = chainOptions;
      return chainOptions;
    })
    .catch((error) => {
      console.error('Failed to fetch chains.json', error);
      return cache ?? FALLBACK;
    });
}

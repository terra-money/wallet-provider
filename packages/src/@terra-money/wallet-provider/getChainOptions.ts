import { NetworkInfo } from '@terra-dev/wallet-types';
import { WalletControllerOptions } from './controller';

interface ChainInfo {
  name: string;
  chainID: string;
  lcd: string;
  walletconnectID?: number;
}

export type WalletControllerChainOptions = Pick<
  WalletControllerOptions,
  'defaultNetwork' | 'walletConnectChainIds'
>;

// TODO update to columnbus-5
const FALLBACK_MAINNET = {
  name: 'mainnet',
  chainID: 'columbus-4',
  lcd: 'https://lcd.terra.dev',
};

const FALLBACK: WalletControllerChainOptions = {
  defaultNetwork: FALLBACK_MAINNET,
  walletConnectChainIds: {
    1: FALLBACK_MAINNET,
    0: {
      name: 'testnet',
      chainID: 'tequila-0004',
      lcd: 'https://tequila-lcd.terra.dev',
    },
    2: {
      name: 'bombay',
      chainID: 'bombay-11',
      lcd: 'https://bombay-lcd.terra.dev',
    },
  },
};

let cache: WalletControllerChainOptions;

export async function getChainOptions(): Promise<WalletControllerChainOptions> {
  return fetch('https://assets.terra.money/chains.json')
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
        } else if (!result[2] && network.name === 'bombay') {
          // TODO remove bombay
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

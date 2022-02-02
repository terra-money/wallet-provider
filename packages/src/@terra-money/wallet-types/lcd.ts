import { LCDClient, LCDClientConfig } from '@terra-money/terra.js';
import { NetworkInfo } from './types';

type Config = Omit<LCDClientConfig, 'URL' | 'chainID'>;
export type WalletLCDClientConfig = Config | ((network: NetworkInfo) => Config);

interface Params {
  lcdClientConfig?: WalletLCDClientConfig;
  network: NetworkInfo;
}

const clients = new Map<string, LCDClient>();

export function createLCDClient({
  lcdClientConfig,
  network,
}: Params): LCDClient {
  const clientConfig: LCDClientConfig = {
    URL: network.lcd,
    chainID: network.chainID,
    ...(typeof lcdClientConfig === 'function'
      ? lcdClientConfig(network)
      : lcdClientConfig
      ? lcdClientConfig
      : {}),
  };

  const cacheKey = JSON.stringify(clientConfig);

  if (clients.has(cacheKey)) {
    return clients.get(cacheKey)!;
  }

  const lcdClient = new LCDClient(clientConfig);

  clients.set(cacheKey, lcdClient);

  return lcdClient;
}

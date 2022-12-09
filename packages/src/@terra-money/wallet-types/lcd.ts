import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';

const clients = new Map<string, LCDClient>();

export function createLCDClient(networks: Record<string, LCDClientConfig>): LCDClient {
  const cacheKey = JSON.stringify(networks);

  if (clients.has(cacheKey)) {
    return clients.get(cacheKey)!;
  }

  const lcdClient = new LCDClient(networks);

  clients.set(cacheKey, lcdClient);

  return lcdClient;
}

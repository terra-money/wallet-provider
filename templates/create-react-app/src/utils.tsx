import { bech32 } from 'bech32';
import { LCDClientConfig } from '@terra-money/feather.js';

export function getRandomAddress(prefix = "terra") {
    const RANDOM_WORDS = [...Array(64)]
      .map(() => Math.random().toString(16).slice(-1))
      .join("")
    return bech32.encode(prefix, bech32.toWords(Buffer.from(RANDOM_WORDS, "hex")))
};
  
export interface ConnectedWalletNetworkInfo extends LCDClientConfig {
  explorer: {
    tx: string;
    address: string;
  };
  baseAsset: string;
  icon: string;
  name: string;
}

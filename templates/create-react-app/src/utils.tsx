import { NetworkInfo } from '@terra-money/wallet-types';
import { bech32 } from 'bech32';

export const getBaseAsset = (network: NetworkInfo, chainID: string) => {
    const baseAsset = Object.keys(network[chainID].gasPrices)[0];
    return baseAsset;
};
export function getRandomAddress(prefix = "terra") {
    const RANDOM_WORDS = [...Array(64)]
      .map(() => Math.random().toString(16).slice(-1))
      .join("")
    return bech32.encode(prefix, bech32.toWords(Buffer.from(RANDOM_WORDS, "hex")))
  }
  
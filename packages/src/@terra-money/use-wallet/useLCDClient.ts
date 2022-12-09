import {
  createLCDClient,
} from '@terra-money/wallet-types';
import { LCDClient } from '@terra-money/feather.js';
import { useMemo } from 'react';
import { useWallet } from './useWallet';

export function useLCDClient(): LCDClient {
  const { network } = useWallet();

  return useMemo<LCDClient>(() => {
    return createLCDClient(network);
  }, [network]);
}

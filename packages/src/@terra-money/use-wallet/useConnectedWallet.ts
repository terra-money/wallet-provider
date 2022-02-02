import {
  ConnectedWallet,
  createConnectedWallet,
} from '@terra-money/wallet-types';
import { useMemo } from 'react';
import { useWallet } from './useWallet';

export function useConnectedWallet(): ConnectedWallet | undefined {
  const {
    status,
    network,
    wallets,
    post,
    sign,
    signBytes,
    supportFeatures,
    connection,
  } = useWallet();

  return useMemo<ConnectedWallet | undefined>(() => {
    return createConnectedWallet({
      status,
      network,
      wallets,
      post,
      sign,
      signBytes,
      supportFeatures,
      connection,
    });
  }, [
    connection,
    network,
    post,
    sign,
    signBytes,
    status,
    supportFeatures,
    wallets,
  ]);
}

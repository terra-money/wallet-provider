import { NetworkInfo } from '@terra-dev/wallet-types';
import React, { ReactNode, useMemo } from 'react';
import { ConnectType, WalletInfo, WalletStatus } from '../types';
import { Wallet, WalletContext } from './useWallet';

export interface StaticWalletProviderProps {
  children: ReactNode;
  defaultNetwork: NetworkInfo;
  status?: WalletStatus;
  availableConnectTypes?: ConnectType[];
  availableInstallTypes?: ConnectType[];
  wallets?: WalletInfo[];
}

export function StaticWalletProvider({
  children,
  defaultNetwork,
  status = WalletStatus.INITIALIZING,
  availableConnectTypes = [],
  availableInstallTypes = [],
  wallets = [],
}: StaticWalletProviderProps) {
  const state = useMemo<Wallet>(() => {
    return {
      availableConnectTypes,
      availableInstallTypes,
      status,
      network: defaultNetwork,
      wallets,
      install: () => {
        throw new Error('not implemented!');
      },
      connect: () => {
        throw new Error('not implemented!');
      },
      connectReadonly: () => {
        throw new Error('not implemented!');
      },
      disconnect: () => {
        throw new Error('not implemented!');
      },
      post: () => {
        throw new Error('not implemented!');
      },
      recheckStatus: () => {
        throw new Error('not implemented!');
      },
      isChromeExtensionCompatibleBrowser: () => {
        throw new Error('not implemented!');
      },
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    defaultNetwork,
    status,
    wallets,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

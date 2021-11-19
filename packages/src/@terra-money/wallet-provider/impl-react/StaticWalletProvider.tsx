import {
  Connection,
  ConnectType,
  NetworkInfo,
  Wallet,
  WalletContext,
  WalletInfo,
  WalletStatus,
} from '@terra-money/use-wallet';
import React, { ReactNode, useMemo } from 'react';

export interface StaticWalletProviderProps {
  children: ReactNode;
  defaultNetwork: NetworkInfo;
  status?: WalletStatus;
  availableConnectTypes?: ConnectType[];
  availableInstallTypes?: ConnectType[];
  availableConnections?: Connection[];
  wallets?: WalletInfo[];
}

export function StaticWalletProvider({
  children,
  defaultNetwork,
  status = WalletStatus.INITIALIZING,
  availableConnectTypes = [],
  availableInstallTypes = [],
  availableConnections = [],
  wallets = [],
}: StaticWalletProviderProps) {
  const state = useMemo<Wallet>(() => {
    return {
      availableConnectTypes,
      availableInstallTypes,
      availableConnections,
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
      sign: () => {
        throw new Error('not implemented!');
      },
      signBytes: () => {
        throw new Error('not implemented!');
      },
      refetchStates: () => {
        throw new Error('not implemented!');
      },
      isChromeExtensionCompatibleBrowser: () => {
        throw new Error('not implemented!');
      },
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    defaultNetwork,
    status,
    wallets,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

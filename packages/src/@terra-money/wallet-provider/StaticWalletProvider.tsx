import { TerraWebExtensionFeatures } from '@terra-money/web-extension-interface';
import {
  Connection,
  ConnectType,
  Installation,
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
  availableInstallations?: Installation[];
  wallets?: WalletInfo[];
  supportFeatures?: Set<TerraWebExtensionFeatures>;
  connection?: Connection | undefined;
}

export function StaticWalletProvider({
  children,
  defaultNetwork,
  status = WalletStatus.INITIALIZING,
  availableConnectTypes = [],
  availableInstallTypes = [],
  availableConnections = [],
  availableInstallations = [],
  wallets = [],
  supportFeatures = new Set(),
  connection = undefined,
}: StaticWalletProviderProps) {
  const state = useMemo<Wallet>(() => {
    return {
      availableConnectTypes,
      availableInstallTypes,
      availableConnections,
      availableInstallations,
      status,
      network: defaultNetwork,
      wallets,
      supportFeatures,
      connection,
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
      recheckStatus: () => {
        throw new Error('not implemented!');
      },
      isChromeExtensionCompatibleBrowser: () => {
        throw new Error('not implemented!');
      },
      hasCW20Tokens: () => {
        throw new Error('not implemented!');
      },
      addCW20Tokens: () => {
        throw new Error('not implemented!');
      },
      hasNetwork: () => {
        throw new Error('not implemented!');
      },
      addNetwork: () => {
        throw new Error('not implemented!');
      },
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    availableInstallations,
    status,
    defaultNetwork,
    wallets,
    supportFeatures,
    connection,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

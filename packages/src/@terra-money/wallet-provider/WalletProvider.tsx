import { TerraWebExtensionFeatures } from '@terra-money/web-extension-interface';
import {
  Connection,
  ConnectType,
  Installation,
  Wallet,
  WalletContext,
  WalletInfo,
  WalletStates,
  WalletStatus,
} from '@terra-money/use-wallet';
import {
  WalletController,
  WalletControllerOptions,
} from '@terra-money/wallet-controller';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';

export interface WalletProviderProps extends WalletControllerOptions {
  children: ReactNode;
}

const EMPTY_ARRAY: WalletInfo[] = [];
const EMPTY_SUPPORT_FEATURES = new Set<TerraWebExtensionFeatures>();

export function WalletProvider({
  children,
  defaultNetwork,
  walletConnectChainIds,
  connectorOpts,
  pushServerOpts,
  createReadonlyWalletSession,
  selectExtension,
  waitingChromeExtensionInstallCheck,
  dangerously__chromeExtensionCompatibleBrowserCheck,
}: WalletProviderProps) {
  const [controller] = useState<WalletController>(
    () =>
      new WalletController({
        defaultNetwork,
        walletConnectChainIds,
        connectorOpts,
        pushServerOpts,
        createReadonlyWalletSession,
        selectExtension,
        waitingChromeExtensionInstallCheck,
        dangerously__chromeExtensionCompatibleBrowserCheck,
      }),
  );

  const [availableConnectTypes, setAvailableConnectTypes] = useState<
    ConnectType[]
  >(() => []);

  const [availableInstallTypes, setAvailableInstallTypes] = useState<
    ConnectType[]
  >(() => []);

  const [availableConnections, setAvailableConnections] = useState<
    Connection[]
  >(() => []);

  const [availableInstallations, setAvailableInstallations] = useState<
    Installation[]
  >(() => []);

  const [states, setStates] = useState<WalletStates>(() => ({
    status: WalletStatus.INITIALIZING,
    network: defaultNetwork,
  }));

  useEffect(() => {
    const availableConnectTypesSubscription = controller
      .availableConnectTypes()
      .subscribe({
        next: (value) => {
          setAvailableConnectTypes(value);
        },
      });

    const availableInstallTypesSubscription = controller
      .availableInstallTypes()
      .subscribe({
        next: (value) => {
          setAvailableInstallTypes(value);
        },
      });

    const availableConnectionsSubscription = controller
      .availableConnections()
      .subscribe({
        next: (value) => {
          setAvailableConnections(value);
        },
      });

    const availableInstallationsSubscription = controller
      .availableInstallations()
      .subscribe({
        next: (value) => {
          setAvailableInstallations(value);
        },
      });

    const statesSubscription = controller.states().subscribe({
      next: (value) => {
        setStates(value);
      },
    });

    return () => {
      availableConnectTypesSubscription.unsubscribe();
      availableInstallTypesSubscription.unsubscribe();
      availableConnectionsSubscription.unsubscribe();
      availableInstallationsSubscription.unsubscribe();
      statesSubscription.unsubscribe();
    };
  }, [controller]);

  const state = useMemo<Wallet>(() => {
    return {
      availableConnectTypes,
      availableInstallTypes,
      availableConnections,
      availableInstallations,
      status: states.status,
      network: states.network,
      wallets:
        states.status === WalletStatus.WALLET_CONNECTED
          ? states.wallets
          : EMPTY_ARRAY,
      install: controller.install,
      connect: controller.connect,
      connectReadonly: controller.connectReadonly,
      disconnect: controller.disconnect,
      connection:
        states.status === WalletStatus.WALLET_CONNECTED
          ? states.connection
          : undefined,
      supportFeatures:
        states.status === WalletStatus.WALLET_CONNECTED
          ? states.supportFeatures
          : EMPTY_SUPPORT_FEATURES,
      post: controller.post,
      sign: controller.sign,
      signBytes: controller.signBytes,
      hasCW20Tokens: controller.hasCW20Tokens,
      addCW20Tokens: controller.addCW20Tokens,
      hasNetwork: controller.hasNetwork,
      addNetwork: controller.addNetwork,
      refetchStates: controller.refetchStates,
      recheckStatus: controller.refetchStates,
      isChromeExtensionCompatibleBrowser:
        controller.isChromeExtensionCompatibleBrowser,
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    availableInstallations,
    controller,
    states,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

import {
  ConnectType,
  Wallet,
  WalletContext,
  WalletInfo,
  WalletStates,
  WalletStatus,
} from '@terra-dev/use-wallet';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { WalletController, WalletControllerOptions } from '../controller';

export interface WalletProviderProps extends WalletControllerOptions {
  children: ReactNode;
}

const EMPTY_ARRAY: WalletInfo[] = [];

export function WalletProvider({
  children,
  defaultNetwork,
  walletConnectChainIds,
  connectorOpts,
  pushServerOpts,
  createReadonlyWalletSession,
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

    const statesSubscription = controller.states().subscribe({
      next: (value) => {
        setStates(value);
      },
    });

    return () => {
      availableConnectTypesSubscription.unsubscribe();
      availableInstallTypesSubscription.unsubscribe();
      statesSubscription.unsubscribe();
    };
  }, [controller]);

  const state = useMemo<Wallet>(() => {
    return {
      availableConnectTypes,
      availableInstallTypes,
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
      post: controller.post,
      sign: controller.sign,
      signBytes: controller.signBytes,
      recheckStatus: controller.recheckStatus,
      isChromeExtensionCompatibleBrowser:
        controller.isChromeExtensionCompatibleBrowser,
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    controller.connect,
    controller.connectReadonly,
    controller.disconnect,
    controller.install,
    controller.post,
    controller.sign,
    controller.signBytes,
    controller.recheckStatus,
    controller.isChromeExtensionCompatibleBrowser,
    states,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

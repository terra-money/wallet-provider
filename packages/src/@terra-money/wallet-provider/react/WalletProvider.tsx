import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { WalletController, WalletControllerOptions } from '../controller';
import { ConnectType, WalletInfo, WalletStates, WalletStatus } from '../types';
import { Wallet, WalletContext } from './useWallet';

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
  //const [status, setStatus] = useState<WalletStatus>(WalletStatus.INITIALIZING);
  //const [network, setNetwork] = useState<NetworkInfo>(defaultNetwork);
  //const [wallets, setWallets] = useState<WalletInfo[]>(EMPTY_ARRAY);

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
        //console.log('WalletProvider.tsx..next()', JSON.stringify(value, null, 2));
        //setStatus(value.status);
        //setNetwork(value.network);
        //setWallets(
        //  value.status === WalletStatus.WALLET_CONNECTED
        //    ? value.wallets
        //    : EMPTY_ARRAY,
        //);
      },
    });

    //const statusSubscription = controller.status().subscribe({
    //  next: (value) => {
    //    setStatus(value);
    //  },
    //});
    //
    //const networkSubscription = controller.network().subscribe({
    //  next: (value) => {
    //    setNetwork(value);
    //  },
    //});
    //
    //const walletsSubscription = controller.wallets().subscribe({
    //  next: (value) => {
    //    setWallets(value);
    //  },
    //});

    return () => {
      availableConnectTypesSubscription.unsubscribe();
      availableInstallTypesSubscription.unsubscribe();
      statesSubscription.unsubscribe();
      //statusSubscription.unsubscribe();
      //networkSubscription.unsubscribe();
      //walletsSubscription.unsubscribe();
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
      recheckStatus: controller.recheckStatus,
    };
  }, [
    availableConnectTypes,
    availableInstallTypes,
    controller.connect,
    controller.connectReadonly,
    controller.disconnect,
    controller.install,
    controller.post,
    controller.recheckStatus,
    states,
  ]);

  return (
    <WalletContext.Provider value={state}>{children}</WalletContext.Provider>
  );
}

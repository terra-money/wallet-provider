import { NetworkInfo, SignResult } from '@terra-dev/wallet-types';
import { AccAddress, CreateTxOptions } from '@terra-money/terra.js';
import { useMemo } from 'react';
import { TxResult } from './tx';
import { ConnectType, WalletStatus } from './types';
import { useWallet } from './useWallet';

type HumanAddr = string & { __type: 'HumanAddr' };

export interface ConnectedWallet {
  network: NetworkInfo;
  terraAddress: HumanAddr;
  walletAddress: HumanAddr;
  design?: string;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  sign: (tx: CreateTxOptions) => Promise<SignResult>;
  availablePost: boolean;
  availableSign: boolean;
  connectType: ConnectType;
}

export function useConnectedWallet(): ConnectedWallet | undefined {
  const { status, network, wallets, post, sign } = useWallet();

  const value = useMemo<ConnectedWallet | undefined>(() => {
    try {
      if (
        status === WalletStatus.WALLET_CONNECTED &&
        wallets.length > 0 &&
        AccAddress.validate(wallets[0].terraAddress)
      ) {
        const { terraAddress, connectType, design } = wallets[0];

        return {
          network,
          terraAddress: terraAddress as HumanAddr,
          walletAddress: terraAddress as HumanAddr,
          design,
          post: (tx: CreateTxOptions) => {
            return post(tx, { terraAddress });
          },
          sign: (tx: CreateTxOptions) => {
            return sign(tx, { terraAddress });
          },
          availablePost:
            connectType === ConnectType.WEB_CONNECT ||
            connectType === ConnectType.CHROME_EXTENSION ||
            connectType === ConnectType.WALLETCONNECT,
          availableSign: connectType === ConnectType.CHROME_EXTENSION,
          connectType,
        };
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  }, [network, post, sign, status, wallets]);

  return value;
}

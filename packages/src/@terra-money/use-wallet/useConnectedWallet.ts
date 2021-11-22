import { AccAddress, CreateTxOptions } from '@terra-money/terra.js';
import { useMemo } from 'react';
import {
  ConnectType,
  NetworkInfo,
  SignResult,
  TxResult,
  WalletStatus,
} from './types';
import { useWallet } from './useWallet';

type HumanAddr = string & { __type: 'HumanAddr' };

export interface ConnectedWallet {
  network: NetworkInfo;
  walletAddress: HumanAddr;
  /** terraAddress is same as walletAddress */
  terraAddress: HumanAddr;
  design?: string;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  sign: (tx: CreateTxOptions) => Promise<SignResult>;
  //signBytes: (bytes: Buffer) => Promise<SignBytesResult>;
  availablePost: boolean;
  availableSign: boolean;
  //availableSignBytes: boolean;
  connectType: ConnectType;
}

export function useConnectedWallet(): ConnectedWallet | undefined {
  const { status, network, wallets, post, sign, supportFeatures } = useWallet();

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
            return post(tx, terraAddress);
          },
          sign: (tx: CreateTxOptions) => {
            return sign(tx, terraAddress);
          },
          //signBytes: (bytes: Buffer) => {
          //  return signBytes(bytes, { terraAddress });
          //},
          availablePost: supportFeatures.has('post'),
          availableSign: supportFeatures.has('sign'),
          //availableSignBytes: connectType === ConnectType.CHROME_EXTENSION,
          connectType,
        };
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  }, [network, post, sign, status, supportFeatures, wallets]);

  return value;
}

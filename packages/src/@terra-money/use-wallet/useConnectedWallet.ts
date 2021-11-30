import {
  Connection,
  ConnectType,
  NetworkInfo,
  SignBytesResult,
  SignResult,
  TxResult,
  WalletStatus,
} from '@terra-dev/wallet-types';
import { AccAddress, CreateTxOptions } from '@terra-money/terra.js';
import { useMemo } from 'react';
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
  signBytes: (bytes: Buffer) => Promise<SignBytesResult>;
  availablePost: boolean;
  availableSign: boolean;
  availableSignBytes: boolean;
  connectType: ConnectType;
  connection: Connection;
}

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

  const value = useMemo<ConnectedWallet | undefined>(() => {
    try {
      if (
        status === WalletStatus.WALLET_CONNECTED &&
        wallets.length > 0 &&
        AccAddress.validate(wallets[0].terraAddress) &&
        !!connection
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
          signBytes: (bytes: Buffer) => {
            return signBytes(bytes, terraAddress);
          },
          availablePost: supportFeatures.has('post'),
          availableSign: supportFeatures.has('sign'),
          availableSignBytes: supportFeatures.has('sign-bytes'),
          connectType,
          connection,
        };
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
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

  return value;
}

import { AccAddress, CreateTxOptions } from '@terra-money/feather.js';
import {
  Connection,
  ConnectType,
  Installation,
  NetworkInfo,
  SignBytesResult,
  SignResult,
  TxResult,
  WalletInfo,
  WalletStatus,
} from './types';

export interface ConnectedWallet {
  network: NetworkInfo;
  addresses: Record<string, AccAddress>;
  //walletAddress: AccAddress;
  /** terraAddress is same as walletAddress */
  //terraAddress: AccAddress;
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

interface CreateConnectedWalletParams {
  status: WalletStatus;
  network: NetworkInfo;
  wallets: WalletInfo[];
  connection: Connection | undefined;
  post: (tx: CreateTxOptions, terraAddress?: string) => Promise<TxResult>;
  sign: (tx: CreateTxOptions, terraAddress?: string) => Promise<SignResult>;
  signBytes: (bytes: Buffer, terraAddress?: string) => Promise<SignBytesResult>;
  supportFeatures: Set<
    'post' | 'sign' | 'sign-bytes' | 'cw20-token' | 'network'
  >;
}

export function createConnectedWallet({
  connection,
  post,
  sign,
  signBytes,
  supportFeatures,
  wallets,
  status,
  network,
}: CreateConnectedWalletParams): ConnectedWallet | undefined {
  try {
    if (
      status === WalletStatus.WALLET_CONNECTED &&
      wallets.length > 0 &&
      // TODO: validate addresses
      //AccAddress.validate(wallets[0].terraAddress) &&
      !!connection
    ) {
      const { addresses, connectType, design } = wallets[0];

      return {
        network,
        addresses,
        design,
        post: (tx: CreateTxOptions) => {
          return post(tx, addresses[tx.chainID]);
        },
        sign: (tx: CreateTxOptions) => {
          return sign(tx, addresses[tx.chainID]);
        },
        signBytes: (bytes: Buffer) => {
          return signBytes(bytes);
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
}

interface CreateInstallableWallets {
  status: WalletStatus;
  installations: Installation[];
}

export function createInstallableWallets({
  status,
  installations,
}: CreateInstallableWallets): Installation[] | undefined {
  if (status === WalletStatus.WALLET_NOT_CONNECTED) {
    return installations;
  }
  return undefined;
}

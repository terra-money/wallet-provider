import { AccAddress, ExtensionOptions } from '@terra-money/terra.js';
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

type HumanAddr = string & { __type: 'HumanAddr' };

export interface ConnectedWallet {
  network: NetworkInfo;
  walletAddress: HumanAddr;
  /** terraAddress is same as walletAddress */
  terraAddress: HumanAddr;
  design?: string;
  post: (tx: ExtensionOptions) => Promise<TxResult>;
  sign: (tx: ExtensionOptions) => Promise<SignResult>;
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
  post: (tx: ExtensionOptions, terraAddress?: string) => Promise<TxResult>;
  sign: (tx: ExtensionOptions, terraAddress?: string) => Promise<SignResult>;
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
      AccAddress.validate(wallets[0].terraAddress) &&
      !!connection
    ) {
      const { terraAddress, connectType, design } = wallets[0];

      return {
        network,
        terraAddress: terraAddress as HumanAddr,
        walletAddress: terraAddress as HumanAddr,
        design,
        post: (tx: ExtensionOptions) => {
          return post(tx, terraAddress);
        },
        sign: (tx: ExtensionOptions) => {
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

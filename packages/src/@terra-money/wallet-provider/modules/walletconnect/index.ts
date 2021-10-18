import {
  connect,
  connectIfSessionExists,
  WalletConnectController,
  WalletConnectControllerOptions,
  WalletConnectCreateTxFailed,
  WalletConnectSession,
  WalletConnectSessionConnected,
  WalletConnectSessionDisconnected,
  WalletConnectSessionRequested,
  WalletConnectSessionStatus,
  WalletConnectTimeout,
  WalletConnectTxFailed,
  WalletConnectTxResult,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
} from '@terra-dev/walletconnect';

export {
  connect,
  connectIfSessionExists,
  WalletConnectCreateTxFailed,
  WalletConnectSessionStatus,
  WalletConnectTimeout,
  WalletConnectTxFailed,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
};
export type {
  WalletConnectTxResult,
  WalletConnectSession,
  WalletConnectController,
  WalletConnectControllerOptions,
  WalletConnectSessionConnected,
  WalletConnectSessionDisconnected,
  WalletConnectSessionRequested,
};

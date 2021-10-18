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

export { connect, connectIfSessionExists };
export type {
  WalletConnectSession,
  WalletConnectController,
  WalletConnectControllerOptions,
  WalletConnectCreateTxFailed,
  WalletConnectSessionStatus,
  WalletConnectTimeout,
  WalletConnectTxFailed,
  WalletConnectTxResult,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
  WalletConnectSessionConnected,
  WalletConnectSessionDisconnected,
  WalletConnectSessionRequested,
};

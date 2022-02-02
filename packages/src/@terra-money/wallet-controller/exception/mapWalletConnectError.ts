import { CreateTxOptions } from '@terra-money/terra.js';
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
} from '@terra-money/wallet-types';
import {
  WalletConnectCreateTxFailed,
  WalletConnectTimeout,
  WalletConnectTxFailed,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
} from '../modules/walletconnect';
import { isError } from './isError';

export function mapWalletConnectError(
  tx: CreateTxOptions,
  error: unknown,
): Error {
  if (
    isError(error, UserDenied) ||
    isError(error, Timeout) ||
    isError(error, CreateTxFailed) ||
    isError(error, TxFailed) ||
    isError(error, TxUnspecifiedError)
  ) {
    return error;
  } else if (isError(error, WalletConnectUserDenied)) {
    return new UserDenied();
  } else if (isError(error, WalletConnectTimeout)) {
    return new Timeout(error.message);
  } else if (isError(error, WalletConnectCreateTxFailed)) {
    return new CreateTxFailed(tx, error.message);
  } else if (isError(error, WalletConnectTxFailed)) {
    return new TxFailed(tx, error.txhash, error.message, null);
  } else if (isError(error, WalletConnectTxUnspecifiedError)) {
    return new TxUnspecifiedError(tx, error.message);
  }
  return new TxUnspecifiedError(
    tx,
    error instanceof Error ? error.message : String(error),
  );
}

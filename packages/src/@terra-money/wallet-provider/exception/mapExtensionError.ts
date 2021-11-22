import {
  WebExtensionCreateTxFailed,
  WebExtensionTxFailed,
  WebExtensionTxUnspecifiedError,
  WebExtensionUserDenied,
} from '@terra-dev/web-extension-interface';
import { CreateTxOptions } from '@terra-money/terra.js';
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
} from '@terra-money/use-wallet';
import { isError } from './isError';

export function mapExtensionError(tx: CreateTxOptions, error: unknown): Error {
  if (
    isError(error, UserDenied) ||
    isError(error, Timeout) ||
    isError(error, CreateTxFailed) ||
    isError(error, TxFailed) ||
    isError(error, TxUnspecifiedError)
  ) {
    return error;
  } else if (isError(error, WebExtensionUserDenied)) {
    return new UserDenied();
  } else if (isError(error, WebExtensionCreateTxFailed)) {
    return new CreateTxFailed(tx, error.message);
  } else if (isError(error, WebExtensionTxFailed)) {
    return new TxFailed(tx, error.txhash, error.message, null);
  } else if (isError(error, WebExtensionTxUnspecifiedError)) {
    return new TxUnspecifiedError(tx, error.message);
  }
  return new TxUnspecifiedError(
    tx,
    error instanceof Error ? error.message : String(error),
  );
}

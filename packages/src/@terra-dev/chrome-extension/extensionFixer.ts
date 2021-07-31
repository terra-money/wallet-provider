import { NetworkInfo, UserDenied } from '@terra-dev/wallet-types';
import { Extension } from '@terra-money/terra.js';
import {
  ChromeExtensionCreateTxFailed,
  ChromeExtensionTxFailed,
  ChromeExtensionUnspecifiedError,
} from './errors';

type ConnectResponse = { address?: string };
type PostResponse = any;
type InfoResponse = NetworkInfo;

export interface FixedExtension {
  isAvailable: () => boolean;
  post: (data: object) => Promise<PostResponse>;
  info: () => Promise<InfoResponse>;
  connect: () => Promise<ConnectResponse>;
  inTransactionProgress: () => boolean;
}

function toExplicitError(error: any) {
  if (error && 'code' in error) {
    switch (error.code) {
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L182
      case 1:
        return new UserDenied();
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L137
      case 2:
        if (error.data) {
          const { txhash } = error.data;
          return new ChromeExtensionTxFailed(txhash, error.message);
        } else {
          return new ChromeExtensionTxFailed(undefined, error.message);
        }
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L153
      case 3:
        return new ChromeExtensionCreateTxFailed(error.message);
      default:
        return new ChromeExtensionUnspecifiedError(error.message);
    }
  } else {
    return new ChromeExtensionUnspecifiedError();
  }
}

export function extensionFixer(extension: Extension): FixedExtension {
  let _inTransactionProgress = false;

  function post(data: object) {
    return new Promise<PostResponse>((resolve, reject) => {
      _inTransactionProgress = true;

      extension.post({
        ...(data as any),
        purgeQueue: true,
      });

      extension.once('onPost', (result) => {
        _inTransactionProgress = false;

        if (!result) return;

        const { error, ...payload } = result;

        if (!payload.success) {
          reject(toExplicitError(error));
        } else if (resolve) {
          resolve({ name: 'onPost', payload });
        }
      });
    });
  }

  function connect() {
    return extension.request('connect').then(({ payload }) => {
      return payload;
    });
  }

  function info() {
    return extension.request('info').then(({ payload }) => {
      return payload as NetworkInfo;
    });
  }

  function isAvailable() {
    return extension.isAvailable;
  }

  function inTransactionProgress() {
    return _inTransactionProgress;
  }

  return {
    post,
    connect,
    info,
    isAvailable,
    inTransactionProgress,
  };
}

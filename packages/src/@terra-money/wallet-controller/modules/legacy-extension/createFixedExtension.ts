import { NetworkInfo } from '@terra-money/wallet-types';
import {
  WebExtensionCreateTxFailed,
  WebExtensionTxFailed,
  WebExtensionTxUnspecifiedError,
  WebExtensionUserDenied,
} from '@terra-money/web-extension-interface';
import { CreateTxOptions, Extension, Tx } from '@terra-money/terra.js';

type ConnectResponse = { address?: string };
type PostResponse = {
  payload: {
    result: {
      height: number;
      raw_log: string;
      txhash: string;
    };
  };
};
type SignResponse = {
  payload: {
    result: Tx.Data;
  };
};
type SignBytesResponse = {
  payload: {
    result: {
      public_key: string;
      recid: number;
      signature: string;
    };
  };
};
type InfoResponse = NetworkInfo;

export interface FixedExtension {
  post: (data: CreateTxOptions) => Promise<PostResponse>;
  sign: (data: CreateTxOptions) => Promise<SignResponse>;
  signBytes: (bytes: Buffer) => Promise<SignBytesResponse>;
  info: () => Promise<InfoResponse>;
  connect: () => Promise<ConnectResponse>;
  inTransactionProgress: () => boolean;
  disconnect: () => void;
}

function getErrorMessage(error: any): string {
  try {
    if (typeof error.message === 'string') {
      return error.message;
    } else {
      return JSON.stringify(error);
    }
  } catch {
    return String(error);
  }
}

function toExplicitError(error: any) {
  if (error && 'code' in error) {
    switch (error.code) {
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L182
      case 1:
        return new WebExtensionUserDenied();
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L137
      case 2:
        if (error.data) {
          const { txhash } = error.data;
          return new WebExtensionTxFailed(txhash, getErrorMessage(error), null);
        } else {
          return new WebExtensionTxFailed(
            undefined,
            getErrorMessage(error),
            null,
          );
        }
      // @see https://github.com/terra-project/station/blob/main/src/extension/Confirm.tsx#L153
      case 3:
        return new WebExtensionCreateTxFailed(getErrorMessage(error));
      default:
        return new WebExtensionTxUnspecifiedError(getErrorMessage(error));
    }
  } else {
    return new WebExtensionTxUnspecifiedError(getErrorMessage(error));
  }
}

function isValidResult({ error, ...payload }: any): boolean {
  if (typeof payload.success !== 'boolean') {
    return false;
  } else if (
    typeof payload.result === 'undefined' &&
    typeof error === 'undefined'
  ) {
    return false;
  }
  return true;
}

const pool = new Map<string, FixedExtension>();

export function createFixedExtension(identifier: string): FixedExtension {
  if (pool.has(identifier)) {
    return pool.get(identifier)!;
  }

  const extension = new Extension(identifier);

  let _inTransactionProgress = false;

  const postResolvers = new Map<
    number,
    [(data: any) => void, (error: any) => void]
  >();

  const signResolvers = new Map<
    number,
    [(data: any) => void, (error: any) => void]
  >();

  const signBytesResolvers = new Map<
    number,
    [(data: any) => void, (error: any) => void]
  >();

  const infoResolvers = new Set<[(data: any) => void, (error: any) => void]>();

  const connectResolvers = new Set<
    [(data: any) => void, (error: any) => void]
  >();

  extension.on('onPost', (result) => {
    if (!result || !isValidResult(result)) {
      return;
    }

    const { error, ...payload } = result;

    if (!postResolvers.has(payload.id)) {
      return;
    }

    const [resolve, reject] = postResolvers.get(payload.id)!;

    if (!payload.success) {
      reject(toExplicitError(error));
    } else if (resolve) {
      resolve({ name: 'onPost', payload });
    }

    postResolvers.delete(payload.id);

    if (postResolvers.size === 0) {
      _inTransactionProgress = false;
    }
  });

  extension.on('onSign', (result) => {
    if (!result || !isValidResult(result)) {
      return;
    }

    const { error, ...payload } = result;

    if (signResolvers.has(payload.id)) {
      const [resolve, reject] = signResolvers.get(payload.id)!;

      if (!payload.success) {
        reject(toExplicitError(error));
      } else if (resolve) {
        resolve({ name: 'onSign', payload });
      }

      signResolvers.delete(payload.id);

      if (signResolvers.size === 0) {
        _inTransactionProgress = false;
      }
    } else if (signBytesResolvers.has(payload.id)) {
      const [resolve, reject] = signBytesResolvers.get(payload.id)!;

      if (!payload.success) {
        reject(toExplicitError(error));
      } else if (resolve) {
        resolve({ name: 'onSignBytes', payload });
      }

      signBytesResolvers.delete(payload.id);

      if (signBytesResolvers.size === 0) {
        _inTransactionProgress = false;
      }
    }
  });

  extension.on('onInfo', (result) => {
    if (!result) return;
    const { error, ...payload } = result;

    for (const [resolve, reject] of infoResolvers) {
      if (error) {
        reject(error);
      } else {
        resolve(payload);
      }
    }

    infoResolvers.clear();
  });

  extension.on('onConnect', (result) => {
    if (!result) return;
    const { error, ...payload } = result;

    for (const [resolve, reject] of connectResolvers) {
      if (error) {
        reject(error);
      } else {
        resolve(payload);
      }
    }

    connectResolvers.clear();
  });

  function post(data: object) {
    return new Promise<PostResponse>((...resolver) => {
      _inTransactionProgress = true;

      const id = extension.post({
        ...(data as any),
        purgeQueue: true,
      });

      postResolvers.set(id, resolver);

      setTimeout(() => {
        if (postResolvers.has(id)) {
          postResolvers.delete(id);

          if (postResolvers.size === 0) {
            _inTransactionProgress = false;
          }
        }
      }, 1000 * 120);
    });
  }

  function sign(data: object) {
    return new Promise<SignResponse>((...resolver) => {
      _inTransactionProgress = true;

      const id = extension.sign({
        ...(data as any),
        purgeQueue: true,
      });

      signResolvers.set(id, resolver);

      setTimeout(() => {
        if (signResolvers.has(id)) {
          signResolvers.delete(id);

          if (signResolvers.size === 0) {
            _inTransactionProgress = false;
          }
        }
      }, 1000 * 120);
    });
  }

  function signBytes(bytes: Buffer) {
    return new Promise<SignBytesResponse>((...resolver) => {
      _inTransactionProgress = true;

      const id = extension.signBytes({
        bytes,
        purgeQueue: true,
      });

      signBytesResolvers.set(id, resolver);

      setTimeout(() => {
        if (signBytesResolvers.has(id)) {
          signBytesResolvers.delete(id);

          if (signBytesResolvers.size === 0) {
            _inTransactionProgress = false;
          }
        }
      }, 1000 * 120);
    });
  }

  function connect() {
    return new Promise<ConnectResponse>((...resolver) => {
      connectResolvers.add(resolver);
      extension.connect();
    });
  }

  function info() {
    return new Promise<InfoResponse>((...resolver) => {
      infoResolvers.add(resolver);
      extension.info();
    });
  }

  function disconnect() {
    connectResolvers.clear();
    infoResolvers.clear();
    postResolvers.clear();
    signResolvers.clear();
    signBytesResolvers.clear();
  }

  function inTransactionProgress() {
    return _inTransactionProgress;
  }

  const result: FixedExtension = {
    post,
    sign,
    signBytes,
    connect,
    info,
    disconnect,
    inTransactionProgress,
  };

  pool.set(identifier, result);

  return result;
}

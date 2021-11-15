import { NetworkInfo, UserDenied } from '@terra-dev/wallet-types';
import {
  ChromeExtensionCreateTxFailed,
  ChromeExtensionTxFailed,
  ChromeExtensionUnspecifiedError,
} from './errors';
import { Extension } from '@terra-money/terra.js';

type ConnectResponse = { address?: string };
type PostResponse = any;
type SignResponse = any;
type InfoResponse = NetworkInfo;

export interface FixedExtension {
  ///** @deprecated do not use extension.isAvailable just use window.isTerraExtensionAvailable... */
  //isAvailable: () => boolean;
  post: (data: object) => Promise<PostResponse>;
  sign: (data: object) => Promise<SignResponse>;
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

const pool = new Map<string, FixedExtension>();

export function extensionFixer(identifier: string): FixedExtension {
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

  const infoResolvers = new Set<[(data: any) => void, (error: any) => void]>();

  const connectResolvers = new Set<
    [(data: any) => void, (error: any) => void]
  >();

  extension.on('onPost', (result) => {
    if (!result) return;

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
    if (!result) return;

    const { error, ...payload } = result;

    if (!signResolvers.has(payload.id)) {
      return;
    }

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

  //function isAvailable() {
  //  return extension.isAvailable;
  //}

  function inTransactionProgress() {
    return _inTransactionProgress;
  }

  const result: FixedExtension = {
    post,
    sign,
    connect,
    info,
    //isAvailable,
    inTransactionProgress,
  };

  pool.set(identifier, result);

  return result;
}

import {
  WebExtensionCreateTxFailed,
  WebExtensionTxFailed,
  WebExtensionTxStatus,
  WebExtensionTxUnspecifiedError,
  WebExtensionUserDenied,
} from '@terra-dev/web-extension-interface';
import { AccAddress, CreateTxOptions, Tx } from '@terra-money/terra.js';
import {
  Connection,
  ConnectType,
  CreateTxFailed,
  NetworkInfo,
  SignResult,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  UserDenied,
  WalletStates,
  WalletStatus,
} from '@terra-money/use-wallet';
import deepEqual from 'fast-deep-equal';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  CHROME_EXTENSION_INSTALL_URL,
  DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
} from './env';
import {
  ExtensionRouter,
  ExtensionRouterStatus,
} from './modules/extension-router';
import {
  ExtensionInfo,
  getTerraExtensions,
} from './modules/extension-router/multiChannel';
import {
  connect as reConnect,
  connectIfSessionExists as reConnectIfSessionExists,
  ReadonlyWalletController,
  readonlyWalletModal,
  ReadonlyWalletSession,
} from './modules/readonly-wallet';
import {
  connect as wcConnect,
  connectIfSessionExists as wcConnectIfSessionExists,
  WalletConnectController,
  WalletConnectControllerOptions,
  WalletConnectCreateTxFailed,
  WalletConnectSessionStatus,
  WalletConnectTimeout,
  WalletConnectTxFailed,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
} from './modules/walletconnect';
import { isDesktopChrome } from './utils/browser-check';
import { checkExtensionReady } from './utils/checkExtensionReady';

export interface WalletControllerOptions
  extends WalletConnectControllerOptions {
  /**
   * ⚠️ Don't hardcoding this, use getChain Options()
   *
   * fallback network if controller is not connected
   */
  defaultNetwork: NetworkInfo;

  /**
   * ⚠️ Don't hardcoding this, use getChain Options()
   *
   * for walletconnect
   *
   * The network rules passed by the Terra Station Mobile are 0 is testnet, 1 is mainnet.
   *
   * Always set testnet for 0 and mainnet for 1.
   *
   * @example
   * ```
   * const mainnet: NetworkInfo = {
   *  name: 'mainnet',
   *  chainID: 'columbus-5',
   *  lcd: 'https://lcd.terra.dev',
   * }
   *
   * const testnet: NetworkInfo = {
   *  name: 'testnet',
   *  chainID: 'bombay-12',
   *  lcd: 'https://bombay-lcd.terra.dev',
   * }
   *
   * const walletConnectChainIds: Record<number, NetworkInfo> = {
   *   0: testnet,
   *   1: mainnet,
   * }
   *
   * <WalletProvider walletConnectChainIds={walletConnectChainIds}>
   * ```
   */
  walletConnectChainIds: Record<number, NetworkInfo>;

  /**
   * run at executing the `connect(ConnectType.READONLY)`
   */
  createReadonlyWalletSession?: (
    networks: NetworkInfo[],
  ) => Promise<ReadonlyWalletSession | null>;

  /**
   * run at executing the `connect(ConnectType.CHROME_EXTENSION)`
   * if user installed multiple wallets
   */
  selectExtension?: (
    extensionInfos: ExtensionInfo[],
  ) => Promise<ExtensionInfo | null>;

  /**
   * milliseconds to wait checking chrome extension is installed
   *
   * @default 1000 * 3 miliseconds
   */
  waitingChromeExtensionInstallCheck?: number;

  /**
   * ⚠️ This API is an option for wallet developers. Please don't use dApp developers.
   *
   * @example
   * ```
   * <WalletProvider dangerously__chromeExtensionCompatibleBrowserCheck={(userAgent: string) => {
   *   return /MyWallet\//.test(userAgent);
   * }}>
   * ```
   */
  dangerously__chromeExtensionCompatibleBrowserCheck?: (
    userAgent: string,
  ) => boolean;
}

const CONNECTIONS = {
  [ConnectType.READONLY]: {
    type: ConnectType.READONLY,
    name: 'View an address',
    icon: 'https://assets.terra.money/icon/station-extension/icon.png',
  } as Connection,
  [ConnectType.WALLETCONNECT]: {
    type: ConnectType.WALLETCONNECT,
    name: 'Terra Station Mobile',
    icon: 'https://assets.terra.money/icon/station-extension/icon.png',
  } as Connection,
} as const;

const defaultWaitingChromeExtensionInstallCheck = 1000 * 3;

export class WalletController {
  private extension: ExtensionRouter | null = null;
  private walletConnect: WalletConnectController | null = null;
  private readonlyWallet: ReadonlyWalletController | null = null;

  private _availableConnectTypes: BehaviorSubject<ConnectType[]>;
  private _availableInstallTypes: BehaviorSubject<ConnectType[]>;
  private _states: BehaviorSubject<WalletStates>;

  private disableReadonlyWallet: (() => void) | null = null;
  private disableExtension: (() => void) | null = null;
  private disableWalletConnect: (() => void) | null = null;

  private readonly _notConnected: WalletStates;
  private readonly _initializing: WalletStates;

  constructor(readonly options: WalletControllerOptions) {
    this._notConnected = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: options.defaultNetwork,
    };

    this._initializing = {
      status: WalletStatus.INITIALIZING,
      network: options.defaultNetwork,
    };

    this._availableConnectTypes = new BehaviorSubject<ConnectType[]>([
      ConnectType.READONLY,
      ConnectType.WALLETCONNECT,
    ]);

    this._availableInstallTypes = new BehaviorSubject<ConnectType[]>([]);

    this._states = new BehaviorSubject<WalletStates>(this._initializing);

    let numSessionCheck: number = 0;

    // wait checking the availability of the chrome extension
    // 0. check if extension wallet session is exists
    checkExtensionReady(
      options.waitingChromeExtensionInstallCheck ??
        defaultWaitingChromeExtensionInstallCheck,
      this.isChromeExtensionCompatibleBrowser(),
    ).then((ready: boolean) => {
      if (ready) {
        this._availableConnectTypes.next([
          ConnectType.EXTENSION,
          ConnectType.WALLETCONNECT,
          ConnectType.READONLY,
        ]);

        this.extension = new ExtensionRouter({
          hostWindow: window,
          selectExtension: options.selectExtension,
          dangerously__chromeExtensionCompatibleBrowserCheck:
            options.dangerously__chromeExtensionCompatibleBrowserCheck ??
            DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
          defaultNetwork: options.defaultNetwork,
        });

        const subscription = this.extension
          .states()
          .pipe(
            filter(({ type }) => type !== ExtensionRouterStatus.INITIALIZING),
          )
          .subscribe((extensionStates) => {
            try {
              subscription.unsubscribe();
            } catch {}

            if (
              extensionStates.type === ExtensionRouterStatus.WALLET_CONNECTED &&
              !this.disableWalletConnect &&
              !this.disableReadonlyWallet
            ) {
              this.enableExtension();
            } else if (numSessionCheck === 0) {
              numSessionCheck += 1;
            } else {
              this.updateStates(this._notConnected);
            }
          });
      } else {
        if (isDesktopChrome(this.isChromeExtensionCompatibleBrowser())) {
          this._availableInstallTypes.next([ConnectType.EXTENSION]);
        }

        if (numSessionCheck === 0) {
          numSessionCheck += 1;
        } else {
          this.updateStates(this._notConnected);
        }
      }
    });

    // 1. check if readonly wallet session is exists
    const draftReadonlyWallet = reConnectIfSessionExists();

    if (draftReadonlyWallet) {
      this.enableReadonlyWallet(draftReadonlyWallet);
      return;
    }

    // 2. check if walletconnect sesison is exists
    const draftWalletConnect = wcConnectIfSessionExists(options);

    if (
      draftWalletConnect &&
      draftWalletConnect.getLatestSession().status ===
        WalletConnectSessionStatus.CONNECTED
    ) {
      this.enableWalletConnect(draftWalletConnect);
    } else if (numSessionCheck === 0) {
      numSessionCheck += 1;
    } else {
      this.updateStates(this._notConnected);
    }
  }

  /** @see Wallet#isChromeExtensionCompatibleBrowser */
  isChromeExtensionCompatibleBrowser = (): boolean => {
    return (
      this.options.dangerously__chromeExtensionCompatibleBrowserCheck ??
      DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK
    )(navigator.userAgent);
  };

  /** @see Wallet#availableConnectTypes */
  availableConnectTypes = (): Observable<ConnectType[]> => {
    return this._availableConnectTypes.asObservable();
  };

  /** @see Wallet#availableConnections */
  availableConnections = (): Observable<Connection[]> => {
    return this._availableConnectTypes.pipe(
      map((connectTypes) => {
        const connections: Connection[] = [];

        for (const connectType of connectTypes) {
          if (connectType === ConnectType.EXTENSION) {
            const terraExtensions = getTerraExtensions();

            for (const terraExtension of terraExtensions) {
              connections.push({
                type: ConnectType.EXTENSION,
                identifier: terraExtension.identifier,
                name: terraExtension.name,
                icon: terraExtension.icon,
              });
            }
          } else {
            connections.push(CONNECTIONS[connectType]);
          }
        }

        return connections;
      }),
    );
  };

  /** @see Wallet#availableInstallTypes */
  availableInstallTypes = (): Observable<ConnectType[]> => {
    return this._availableInstallTypes.asObservable();
  };

  /**
   * @see Wallet#status
   * @see Wallet#network
   * @see Wallet#wallets
   */
  states = (): Observable<WalletStates> => {
    return this._states.asObservable();
  };

  /** @see Wallet#recheckStatus */
  refetchStates = () => {
    if (this.disableExtension) {
      this.extension?.refetchStates();
    }
  };

  /** @see Wallet#install */
  install = (type: ConnectType) => {
    if (type === ConnectType.EXTENSION) {
      // TODO separate install links by browser types
      window.open(CHROME_EXTENSION_INSTALL_URL, '_blank');
    } else {
      console.warn(
        `[WalletController] ConnectType "${type}" does not support install() function`,
      );
    }
  };

  /** @see Wallet#connect */
  connect = (type: ConnectType, identifier?: string) => {
    switch (type) {
      case ConnectType.READONLY:
        const networks: NetworkInfo[] = Object.keys(
          this.options.walletConnectChainIds,
        ).map((chainId) => this.options.walletConnectChainIds[+chainId]);

        const createReadonlyWalletSession =
          this.options.createReadonlyWalletSession?.(networks) ??
          readonlyWalletModal({ networks });

        createReadonlyWalletSession.then((readonlyWalletSession) => {
          if (readonlyWalletSession) {
            this.enableReadonlyWallet(reConnect(readonlyWalletSession));
          }
        });
        break;
      case ConnectType.WALLETCONNECT:
        this.enableWalletConnect(wcConnect(this.options));
        break;
      case ConnectType.EXTENSION:
        if (!this.extension) {
          throw new Error(`extension instance is not created!`);
        }
        this.extension.connect(identifier);
        this.enableExtension();
        break;
      default:
        throw new Error(`Unknown ConnectType!`);
    }
  };

  /** @see Wallet#connectReadonly */
  connectReadonly = (terraAddress: string, network: NetworkInfo) => {
    this.enableReadonlyWallet(
      reConnect({
        terraAddress,
        network,
      }),
    );
  };

  /** @see Wallet#disconnect */
  disconnect = () => {
    this.disableReadonlyWallet?.();
    this.disableReadonlyWallet = null;

    this.disableExtension?.();
    this.disableExtension = null;

    this.disableWalletConnect?.();
    this.disableWalletConnect = null;

    this.updateStates(this._notConnected);
  };

  /**
   * @see Wallet#post
   * @param tx
   * @param terraAddress only available new extension
   */
  post = async (
    tx: CreateTxOptions,
    terraAddress?: string,
  ): Promise<TxResult> => {
    // ---------------------------------------------
    // extension
    // ---------------------------------------------
    if (this.disableExtension) {
      return new Promise<TxResult>((resolve, reject) => {
        if (!this.extension) {
          reject(new Error(`extension instance not created!`));
          return;
        }

        const subscription = this.extension.post(tx, terraAddress).subscribe({
          next: (txResult) => {
            if (txResult.status === WebExtensionTxStatus.SUCCEED) {
              resolve({
                ...tx,
                result: txResult.payload,
                success: true,
              });
              subscription.unsubscribe();
            }
          },
          error: (error) => {
            if (error instanceof UserDenied || error instanceof Timeout) {
              reject(error);
            } else if (error instanceof WebExtensionUserDenied) {
              reject(new UserDenied());
            } else if (error instanceof WebExtensionCreateTxFailed) {
              reject(new CreateTxFailed(tx, error.message));
            } else if (error instanceof WebExtensionTxFailed) {
              reject(new TxFailed(tx, error.txhash, error.message, null));
            } else if (error instanceof WebExtensionTxUnspecifiedError) {
              reject(new TxUnspecifiedError(tx, error.message));
            } else {
              reject(
                new TxUnspecifiedError(
                  tx,
                  error instanceof Error ? error.message : String(error),
                ),
              );
            }
            subscription.unsubscribe();
          },
        });
      });
    }
    // ---------------------------------------------
    // wallet connect
    // ---------------------------------------------
    else if (this.walletConnect) {
      return this.walletConnect
        .post(tx)
        .then(
          (result) =>
            ({
              ...tx,
              result,
              success: true,
            } as TxResult),
        )
        .catch((error) => {
          let throwError = error;

          try {
            if (error instanceof WalletConnectUserDenied) {
              throwError = new UserDenied();
            } else if (error instanceof WalletConnectCreateTxFailed) {
              throwError = new CreateTxFailed(tx, error.message);
            } else if (error instanceof WalletConnectTxFailed) {
              throwError = new TxFailed(
                tx,
                error.txhash,
                error.message,
                error.raw_message,
              );
            } else if (error instanceof WalletConnectTimeout) {
              throwError = new Timeout(error.message);
            } else if (error instanceof WalletConnectTxUnspecifiedError) {
              throwError = new TxUnspecifiedError(tx, error.message);
            }
          } catch {
            throwError = new TxUnspecifiedError(
              tx,
              'message' in error ? error.message : String(error),
            );
          }

          throw throwError;
        });
    } else {
      throw new Error(`There are no connections that can be posting tx!`);
    }
  };

  /**
   * @see Wallet#sign
   * @param tx
   * @param terraAddress only available new extension
   */
  sign = async (
    tx: CreateTxOptions,
    terraAddress?: string,
  ): Promise<SignResult> => {
    if (this.disableExtension) {
      return new Promise<SignResult>((resolve, reject) => {
        if (!this.extension) {
          reject(new Error(`extension instance is not created!`));
          return;
        }

        const subscription = this.extension.sign(tx, terraAddress).subscribe({
          next: (txResult) => {
            if (txResult.status === WebExtensionTxStatus.SUCCEED) {
              resolve({
                ...tx,
                result: Tx.fromData(txResult.payload),
                success: true,
              });
              subscription.unsubscribe();
            }
          },
          error: (error) => {
            if (error instanceof UserDenied || error instanceof Timeout) {
              reject(error);
            } else if (error instanceof WebExtensionUserDenied) {
              reject(new UserDenied());
            } else if (error instanceof WebExtensionCreateTxFailed) {
              reject(new CreateTxFailed(tx, error.message));
            } else if (error instanceof WebExtensionTxFailed) {
              reject(new TxFailed(tx, error.txhash, error.message, null));
            } else if (error instanceof WebExtensionTxUnspecifiedError) {
              reject(new TxUnspecifiedError(tx, error.message));
            } else {
              reject(
                new TxUnspecifiedError(
                  tx,
                  error instanceof Error ? error.message : String(error),
                ),
              );
            }
            subscription.unsubscribe();
          },
        });
      });
    }

    throw new Error(`sign() method only available on extension`);
  };

  ///** @see Wallet#signBytes */
  //signBytes = async (
  //  bytes: Buffer,
  //  // TODO not work at this time. for the future extension
  //  txTarget: { terraAddress?: string } = {},
  //): Promise<SignBytesResult> => {
  //  interface SignBytesResultRaw {
  //    bytes: string;
  //    result: {
  //      public_key: string | PublicKey.Data;
  //      recid: string;
  //      signature: string;
  //    };
  //    success: boolean;
  //  }
  //
  //  if (this.disableExtension) {
  //    if (!this.chromeExtension) {
  //      throw new Error(`chromeExtension instance not created!`);
  //    }
  //
  //    return this.chromeExtension
  //      .signBytes<SignBytesResultRaw>(bytes)
  //      .then(({ payload }) => {
  //        const publicKey: PublicKey.Data =
  //          typeof payload.result.public_key === 'string'
  //            ? {
  //                '@type': '/cosmos.crypto.secp256k1.PubKey',
  //                'key': payload.result.public_key,
  //              }
  //            : payload.result.public_key;
  //
  //        const signBytesResult: SignBytesResult['result'] = {
  //          ...payload.result,
  //          public_key: publicKey,
  //        };
  //
  //        return {
  //          ...payload,
  //          result: signBytesResult,
  //          encryptedBytes: payload.bytes,
  //        };
  //      });
  //    //.catch((error) => {
  //    //  // TODO more detailed errors
  //    //  if (error instanceof ChromeExtensionCreateTxFailed) {
  //    //    throw new CreateTxFailed({} as any, error.message);
  //    //  } else if (error instanceof ChromeExtensionTxFailed) {
  //    //    throw new TxFailed({} as any, error.txhash, error.message, null);
  //    //  } else if (error instanceof ChromeExtensionUnspecifiedError) {
  //    //    throw new TxUnspecifiedError({} as any, error.message);
  //    //  }
  //    //  // UserDenied - chrome extension will sent original UserDenied error type
  //    //  // All unspecified errors...
  //    //  throw error;
  //    //});
  //  }
  //
  //  throw new Error(`signBytes() method only available on chrome extension`);
  //  // TODO implements signBytes() to other connect types
  //};

  // ================================================================
  // internal
  // connect type changing
  // ================================================================
  private updateStates = (next: WalletStates) => {
    const prev = this._states.getValue();

    if (
      next.status === WalletStatus.WALLET_CONNECTED &&
      next.wallets.length === 0
    ) {
      next = {
        status: WalletStatus.WALLET_NOT_CONNECTED,
        network: next.network,
      };
    }

    if (prev.status !== next.status || !deepEqual(prev, next)) {
      this._states.next(next);
    }
  };

  private enableReadonlyWallet = (readonlyWallet: ReadonlyWalletController) => {
    this.disableWalletConnect?.();
    this.disableExtension?.();

    if (
      this.readonlyWallet === readonlyWallet ||
      (this.readonlyWallet?.terraAddress === readonlyWallet.terraAddress &&
        this.readonlyWallet.network === readonlyWallet.network)
    ) {
      return;
    }

    if (this.readonlyWallet) {
      this.readonlyWallet.disconnect();
    }

    this.readonlyWallet = readonlyWallet;

    this.updateStates({
      status: WalletStatus.WALLET_CONNECTED,
      network: readonlyWallet.network,
      wallets: [
        {
          connectType: ConnectType.READONLY,
          terraAddress: readonlyWallet.terraAddress,
          design: 'readonly',
        },
      ],
    });

    this.disableReadonlyWallet = () => {
      readonlyWallet.disconnect();
      this.readonlyWallet = null;
      this.disableReadonlyWallet = null;
    };
  };

  private enableExtension = () => {
    this.disableReadonlyWallet?.();
    this.disableWalletConnect?.();

    if (this.disableExtension || !this.extension) {
      return;
    }

    const extensionSubscription = this.extension.states().subscribe({
      next: (extensionStates) => {
        if (
          extensionStates.type === ExtensionRouterStatus.WALLET_CONNECTED &&
          AccAddress.validate(extensionStates.wallet.terraAddress)
        ) {
          this.updateStates({
            status: WalletStatus.WALLET_CONNECTED,
            network: extensionStates.network,
            wallets: [
              {
                connectType: ConnectType.EXTENSION,
                terraAddress: extensionStates.wallet.terraAddress,
                design: extensionStates.wallet.design,
              },
            ],
          });
        } else {
          this.updateStates(this._notConnected);
        }
      },
    });

    this.disableExtension = () => {
      this.extension?.disconnect();
      extensionSubscription.unsubscribe();
      this.disableExtension = null;
    };
  };

  private enableWalletConnect = (walletConnect: WalletConnectController) => {
    this.disableReadonlyWallet?.();
    this.disableExtension?.();

    if (this.walletConnect === walletConnect) {
      return;
    }

    if (this.walletConnect) {
      this.walletConnect.disconnect();
    }

    this.walletConnect = walletConnect;

    const subscribeWalletConnect = (
      wc: WalletConnectController,
    ): Subscription => {
      return wc.session().subscribe({
        next: (status) => {
          switch (status.status) {
            case WalletConnectSessionStatus.CONNECTED:
              this.updateStates({
                status: WalletStatus.WALLET_CONNECTED,
                network:
                  this.options.walletConnectChainIds[status.chainId] ??
                  this.options.defaultNetwork,
                wallets: [
                  {
                    connectType: ConnectType.WALLETCONNECT,
                    terraAddress: status.terraAddress,
                    design: 'walletconnect',
                  },
                ],
              });
              break;
            default:
              this.updateStates(this._notConnected);
              break;
          }
        },
      });
    };

    const walletConnectSessionSubscription =
      subscribeWalletConnect(walletConnect);

    this.disableWalletConnect = () => {
      this.walletConnect?.disconnect();
      this.walletConnect = null;
      walletConnectSessionSubscription.unsubscribe();
      this.disableWalletConnect = null;
    };
  };
}

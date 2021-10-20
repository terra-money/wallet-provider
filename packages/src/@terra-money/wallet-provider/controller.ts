import { isDesktopChrome } from '@terra-dev/browser-check';
import { readonlyWalletModal } from '@terra-dev/readonly-wallet-modal';
import {
  ConnectType,
  TxResult,
  WalletInfo,
  WalletStates,
  WalletStatus,
} from '@terra-dev/use-wallet';
import {
  CreateTxFailed,
  NetworkInfo,
  SignBytesResult,
  SignResult,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
} from '@terra-dev/wallet-types';
import { WebConnectorController } from '@terra-dev/web-connector-controller';
import {
  WebConnectorCreateTxFailed,
  WebConnectorStatusType,
  WebConnectorTxFailed,
  WebConnectorTxResult,
  WebConnectorTxStatus,
  WebConnectorUserDenied,
} from '@terra-dev/web-connector-interface';
import {
  AccAddress,
  AuthInfo,
  CreateTxOptions,
  PublicKey,
  Tx,
  TxBody,
} from '@terra-money/terra.js';
import deepEqual from 'fast-deep-equal';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  CHROME_EXTENSION_INSTALL_URL,
  DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
  WEB_EXTENSION_CONNECTED_KEY,
} from './env';
import {
  ChromeExtensionController,
  ChromeExtensionCreateTxFailed,
  ChromeExtensionStatus,
  ChromeExtensionTxFailed,
  ChromeExtensionUnspecifiedError,
} from './modules/chrome-extension';
import {
  connect as reConnect,
  connectIfSessionExists as reConnectIfSessionExists,
  ReadonlyWalletController,
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
  WalletConnectTxResult,
  WalletConnectTxUnspecifiedError,
  WalletConnectUserDenied,
} from './modules/walletconnect';
import { checkAvailableExtension } from './utils/checkAvailableExtension';

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

const defaultWaitingChromeExtensionInstallCheck = 1000 * 3;

export class WalletController {
  private chromeExtension: ChromeExtensionController | null = null;
  private webConnector: WebConnectorController | null = null;
  private walletConnect: WalletConnectController | null = null;
  private readonlyWallet: ReadonlyWalletController | null = null;

  private _availableConnectTypes: BehaviorSubject<ConnectType[]>;
  private _availableInstallTypes: BehaviorSubject<ConnectType[]>;
  private _states: BehaviorSubject<WalletStates>;

  private disableReadonlyWallet: (() => void) | null = null;
  private disableChromeExtension: (() => void) | null = null;
  private disableWebExtension: (() => void) | null = null;
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
    checkAvailableExtension(
      options.waitingChromeExtensionInstallCheck ??
        defaultWaitingChromeExtensionInstallCheck,
      this.isChromeExtensionCompatibleBrowser(),
    ).then((extensionType) => {
      if (extensionType === ConnectType.WEB_CONNECT) {
        this._availableConnectTypes.next([
          ConnectType.READONLY,
          ConnectType.WEB_CONNECT,
          ConnectType.WALLETCONNECT,
        ]);

        this.webConnector = new WebConnectorController(window);

        const subscription = this.webConnector
          .status()
          .pipe(
            filter((webExtensionStatus) => {
              return (
                webExtensionStatus.type !== WebConnectorStatusType.INITIALIZING
              );
            }),
          )
          .subscribe((webExtensionStatus) => {
            subscription.unsubscribe();

            if (
              webExtensionStatus.type === WebConnectorStatusType.READY &&
              localStorage.getItem(WEB_EXTENSION_CONNECTED_KEY) === 'true' &&
              !this.disableWalletConnect &&
              !this.disableReadonlyWallet
            ) {
              this.enableWebExtension();
            } else if (numSessionCheck === 0) {
              numSessionCheck += 1;
            } else {
              this.updateStates(this._notConnected);
              localStorage.removeItem(WEB_EXTENSION_CONNECTED_KEY);
            }
          });
      } else if (extensionType === ConnectType.CHROME_EXTENSION) {
        this._availableConnectTypes.next([
          ConnectType.READONLY,
          ConnectType.CHROME_EXTENSION,
          ConnectType.WALLETCONNECT,
        ]);

        this.chromeExtension = new ChromeExtensionController({
          enableWalletConnection: true,
          defaultNetwork: options.defaultNetwork,
          dangerously__chromeExtensionCompatibleBrowserCheck:
            options.dangerously__chromeExtensionCompatibleBrowserCheck ??
            DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
        });

        const subscription = this.chromeExtension
          .status()
          .pipe(
            filter((chromeExtensionStatus) => {
              return (
                chromeExtensionStatus !== ChromeExtensionStatus.INITIALIZING
              );
            }),
          )
          .subscribe((chromeExtensionStatus) => {
            try {
              subscription.unsubscribe();
            } catch {}

            if (
              chromeExtensionStatus ===
                ChromeExtensionStatus.WALLET_CONNECTED &&
              !this.disableWalletConnect &&
              !this.disableReadonlyWallet
            ) {
              this.enableChromeExtension();
            } else if (numSessionCheck === 0) {
              numSessionCheck += 1;
            } else {
              this.updateStates(this._notConnected);
            }
          });
      } else {
        if (isDesktopChrome(this.isChromeExtensionCompatibleBrowser())) {
          this._availableInstallTypes.next([ConnectType.CHROME_EXTENSION]);
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

  /** @deprecated please use `states()` */
  status = (): Observable<WalletStatus> => {
    return this._states.pipe(map((data) => data.status));
  };

  /** @deprecated please use `states()` */
  network = (): Observable<NetworkInfo> => {
    return this._states.pipe(map((data) => data.network));
  };

  /** @deprecated please use `states()` */
  wallets = (): Observable<WalletInfo[]> => {
    return this._states.pipe(
      map((data) =>
        data.status === WalletStatus.WALLET_CONNECTED ? data.wallets : [],
      ),
    );
  };

  /** @see Wallet#recheckStatus */
  recheckStatus = () => {
    if (this.disableChromeExtension) {
      this.chromeExtension?.recheckStatus();
    }
  };

  /** @see Wallet#install */
  install = (type: ConnectType) => {
    if (type === ConnectType.CHROME_EXTENSION) {
      window.open(CHROME_EXTENSION_INSTALL_URL, '_blank');
    } else if (type === ConnectType.WEB_CONNECT) {
      const webExtensionStatus = this.webConnector?.getLastStatus();
      if (
        webExtensionStatus?.type === WebConnectorStatusType.NO_AVAILABLE &&
        webExtensionStatus.installLink
      ) {
        window.open(webExtensionStatus.installLink, '_blank');
      }
    } else {
      console.warn(`ConnectType "${type}" does not support install() function`);
    }
  };

  /** @see Wallet#connect */
  connect = (type: ConnectType) => {
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
      case ConnectType.CHROME_EXTENSION:
        this.chromeExtension!.connect().then((success) => {
          if (success) {
            this.enableChromeExtension();
          }
        });
        break;
      case ConnectType.WEB_CONNECT:
        this.enableWebExtension();
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

    this.disableChromeExtension?.();
    this.disableChromeExtension = null;

    this.disableWebExtension?.();
    this.disableWebExtension = null;

    this.disableWalletConnect?.();
    this.disableWalletConnect = null;

    localStorage.removeItem(WEB_EXTENSION_CONNECTED_KEY);
    this.updateStates(this._notConnected);
  };

  /** @see Wallet#post */
  post = async (
    tx: CreateTxOptions,
    // TODO not work at this time. for the future extension
    txTarget: { terraAddress?: string } = {},
  ): Promise<TxResult> => {
    // ---------------------------------------------
    // chrome extension - legacy extension
    // ---------------------------------------------
    if (this.disableChromeExtension) {
      if (!this.chromeExtension) {
        throw new Error(`chromeExtension instance not created!`);
      }

      return (
        this.chromeExtension
          // TODO make WalletConnectTxResult to common type
          .post<CreateTxOptions, { result: WalletConnectTxResult }>(tx)
          .then(({ payload }) => {
            return {
              ...tx,
              result: payload.result,
              success: true,
            } as TxResult;
          })
          .catch((error) => {
            if (error instanceof ChromeExtensionCreateTxFailed) {
              throw new CreateTxFailed(tx, error.message);
            } else if (error instanceof ChromeExtensionTxFailed) {
              throw new TxFailed(tx, error.txhash, error.message, null);
            } else if (error instanceof ChromeExtensionUnspecifiedError) {
              throw new TxUnspecifiedError(tx, error.message);
            }
            // UserDeniedError
            // All unspecified errors...
            throw error;
          })
      );
    }
    // ---------------------------------------------
    // web extension - new extension
    // ---------------------------------------------
    else if (this.disableWebExtension) {
      return new Promise<TxResult>((resolve, reject) => {
        if (!this.webConnector) {
          reject(new Error(`webExtension instance not created!`));
          return;
        }

        const webExtensionStates = this.webConnector.getLastStates();

        if (!webExtensionStates) {
          reject(new Error(`webExtension.getLastStates() returns undefined!`));
          return;
        }

        const focusedWallet = txTarget.terraAddress
          ? webExtensionStates.wallets.find(
              (itemWallet) => itemWallet.terraAddress === txTarget.terraAddress,
            ) ?? webExtensionStates.wallets[0]
          : webExtensionStates.focusedWalletAddress
          ? webExtensionStates.wallets.find(
              (itemWallet) =>
                itemWallet.terraAddress ===
                webExtensionStates.focusedWalletAddress,
            ) ?? webExtensionStates.wallets[0]
          : webExtensionStates.wallets[0];

        const subscription = this.webConnector
          .post(focusedWallet.terraAddress, tx)
          .subscribe({
            next: (extensionTxResult: WebConnectorTxResult) => {
              switch (extensionTxResult.status) {
                case WebConnectorTxStatus.SUCCEED:
                  resolve({
                    ...tx,
                    result: extensionTxResult.payload,
                    success: true,
                  });
                  subscription.unsubscribe();
                  break;
              }
            },
            error: (error) => {
              if (error instanceof WebConnectorUserDenied) {
                reject(new UserDenied());
              } else if (error instanceof WebConnectorCreateTxFailed) {
                reject(new CreateTxFailed(tx, error.message));
              } else if (error instanceof WebConnectorTxFailed) {
                reject(
                  new TxFailed(
                    tx,
                    error.txhash,
                    error.message,
                    error.raw_message,
                  ),
                );
              } else {
                reject(
                  new TxUnspecifiedError(
                    tx,
                    'message' in error ? error.message : String(error),
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

  /** @see Wallet#sign */
  sign = async (
    tx: CreateTxOptions,
    // TODO not work at this time. for the future extension
    txTarget: { terraAddress?: string } = {},
  ): Promise<SignResult> => {
    interface SignResultRaw extends CreateTxOptions {
      result: {
        body: TxBody.Data;
        auth_info: AuthInfo.Data;
        signatures: string[];
      };
      success: boolean;
    }

    if (this.disableChromeExtension) {
      if (!this.chromeExtension) {
        throw new Error(`chromeExtension instance not created!`);
      }

      return this.chromeExtension
        .sign<CreateTxOptions, SignResultRaw>(tx)
        .then(({ payload }) => {
          const result: SignResult['result'] = {
            public_key: null,
            recid: 0,
            signature: null,
            stdSignMsgData: null,
            txData: payload.result,
            tx: Tx.fromData(payload.result),
          };

          return {
            ...tx,
            result,
            success: true,
          };
        })
        .catch((error) => {
          if (error instanceof ChromeExtensionCreateTxFailed) {
            throw new CreateTxFailed(tx, error.message);
          } else if (error instanceof ChromeExtensionTxFailed) {
            throw new TxFailed(tx, error.txhash, error.message, null);
          } else if (error instanceof ChromeExtensionUnspecifiedError) {
            throw new TxUnspecifiedError(tx, error.message);
          }
          // UserDenied - chrome extension will sent original UserDenied error type
          // All unspecified errors...
          throw error;
        });
    }

    throw new Error(`sign() method only available on chrome extension`);
    // TODO implements sign() to other connect types
  };

  /** @see Wallet#signBytes */
  signBytes = async (
    bytes: Buffer,
    // TODO not work at this time. for the future extension
    txTarget: { terraAddress?: string } = {},
  ): Promise<SignBytesResult> => {
    interface SignBytesResultRaw {
      bytes: string;
      result: {
        public_key: string | PublicKey.Data;
        recid: string;
        signature: string;
      };
      success: boolean;
    }

    if (this.disableChromeExtension) {
      if (!this.chromeExtension) {
        throw new Error(`chromeExtension instance not created!`);
      }

      return this.chromeExtension
        .signBytes<SignBytesResultRaw>(bytes)
        .then(({ payload }) => {
          const publicKey: PublicKey.Data =
            typeof payload.result.public_key === 'string'
              ? {
                  '@type': '/cosmos.crypto.secp256k1.PubKey',
                  'key': payload.result.public_key,
                }
              : payload.result.public_key;

          const signBytesResult: SignBytesResult['result'] = {
            ...payload.result,
            public_key: publicKey,
          };

          return {
            ...payload,
            result: signBytesResult,
            encryptedBytes: payload.bytes,
          };
        });
      //.catch((error) => {
      //  // TODO more detailed errors
      //  if (error instanceof ChromeExtensionCreateTxFailed) {
      //    throw new CreateTxFailed({} as any, error.message);
      //  } else if (error instanceof ChromeExtensionTxFailed) {
      //    throw new TxFailed({} as any, error.txhash, error.message, null);
      //  } else if (error instanceof ChromeExtensionUnspecifiedError) {
      //    throw new TxUnspecifiedError({} as any, error.message);
      //  }
      //  // UserDenied - chrome extension will sent original UserDenied error type
      //  // All unspecified errors...
      //  throw error;
      //});
    }

    throw new Error(`signBytes() method only available on chrome extension`);
    // TODO implements signBytes() to other connect types
  };

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
      console.trace('???');
    }

    if (prev.status !== next.status || !deepEqual(prev, next)) {
      this._states.next(next);
    }
  };

  private enableReadonlyWallet = (readonlyWallet: ReadonlyWalletController) => {
    this.disableWalletConnect?.();
    this.disableChromeExtension?.();
    this.disableWebExtension?.();

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

  private enableWebExtension = () => {
    this.disableReadonlyWallet?.();
    this.disableWalletConnect?.();
    this.disableChromeExtension?.();

    if (this.disableWebExtension || !this.webConnector) {
      return;
    }

    const extensionSubscription = combineLatest([
      this.webConnector.status(),
      this.webConnector.states(),
    ]).subscribe(([status, states]) => {
      if (!states) {
        return;
      }

      if (status.type === WebConnectorStatusType.READY) {
        if (states.wallets.length > 0) {
          const focusedWallet = states.focusedWalletAddress
            ? states.wallets.find(
                (itemWallet) =>
                  itemWallet.terraAddress === states.focusedWalletAddress,
              ) ?? states.wallets[0]
            : states.wallets[0];

          this.updateStates({
            status: WalletStatus.WALLET_CONNECTED,
            network: states.network,
            wallets: [
              {
                connectType: ConnectType.WEB_CONNECT,
                terraAddress: focusedWallet.terraAddress,
                design: focusedWallet.design,
              },
            ],
          });
        }
      } else if (status.type === WebConnectorStatusType.NO_AVAILABLE) {
        localStorage.removeItem(WEB_EXTENSION_CONNECTED_KEY);
        this.updateStates(this._notConnected);

        if (!status.isApproved && this.disableWebExtension) {
          this.disableWebExtension();
        }
      }
    });

    localStorage.setItem(WEB_EXTENSION_CONNECTED_KEY, 'true');

    const lastExtensionStatus = this.webConnector.getLastStatus();

    if (
      lastExtensionStatus.type === WebConnectorStatusType.NO_AVAILABLE &&
      lastExtensionStatus.isApproved === false
    ) {
      this.webConnector.requestApproval();
    }

    this.disableWebExtension = () => {
      localStorage.removeItem(WEB_EXTENSION_CONNECTED_KEY);
      extensionSubscription.unsubscribe();
      this.disableWebExtension = null;
    };
  };

  private enableChromeExtension = () => {
    this.disableReadonlyWallet?.();
    this.disableWalletConnect?.();
    this.disableWebExtension?.();

    if (this.disableChromeExtension || !this.chromeExtension) {
      return;
    }

    const extensionSubscription = combineLatest([
      this.chromeExtension.status(),
      this.chromeExtension.networkInfo(),
      this.chromeExtension.terraAddress(),
    ]).subscribe({
      next: ([status, networkInfo, terraAddress]) => {
        if (
          status === ChromeExtensionStatus.WALLET_CONNECTED &&
          typeof terraAddress === 'string' &&
          AccAddress.validate(terraAddress)
        ) {
          this.updateStates({
            status: WalletStatus.WALLET_CONNECTED,
            network: networkInfo,
            wallets: [
              {
                connectType: ConnectType.CHROME_EXTENSION,
                terraAddress,
                design: 'extension',
              },
            ],
          });
        } else {
          this.updateStates(this._notConnected);
        }
      },
    });

    this.disableChromeExtension = () => {
      this.chromeExtension?.disconnect();
      extensionSubscription.unsubscribe();
      this.disableChromeExtension = null;
    };
  };

  private enableWalletConnect = (walletConnect: WalletConnectController) => {
    this.disableReadonlyWallet?.();
    this.disableChromeExtension?.();
    this.disableWebExtension?.();

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

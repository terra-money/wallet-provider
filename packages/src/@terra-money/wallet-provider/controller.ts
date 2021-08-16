import { isDesktopChrome } from '@terra-dev/browser-check';
import {
  ChromeExtensionController,
  ChromeExtensionCreateTxFailed,
  ChromeExtensionStatus,
  ChromeExtensionTxFailed,
  ChromeExtensionUnspecifiedError,
} from '@terra-dev/chrome-extension';
import {
  connect as reConnect,
  connectIfSessionExists as reConnectIfSessionExists,
  ReadonlyWalletController,
  ReadonlyWalletSession,
} from '@terra-dev/readonly-wallet';
import { readonlyWalletModal } from '@terra-dev/readonly-wallet-modal';
import {
  CreateTxFailed,
  NetworkInfo,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
} from '@terra-dev/wallet-types';
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
} from '@terra-dev/walletconnect';
import {
  WebExtensionController,
  WebExtensionCreateTxFailed,
  WebExtensionStatusType,
  WebExtensionTxFailed,
  WebExtensionTxProgress,
  WebExtensionTxStatus,
  WebExtensionTxSucceed,
  WebExtensionUserDenied,
} from '@terra-dev/web-extension';
import { AccAddress, CreateTxOptions } from '@terra-money/terra.js';
import deepEqual from 'fast-deep-equal';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  CHROME_EXTENSION_INSTALL_URL,
  DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
  WEB_EXTENSION_CONNECTED_KEY,
} from './env';
import { TxResult } from './tx';
import { ConnectType, WalletInfo, WalletStates, WalletStatus } from './types';
import { checkAvailableExtension } from './utils/checkAvailableExtension';

export interface WalletControllerOptions
  extends WalletConnectControllerOptions {
  /**
   * fallback network if controller is not connected
   */
  defaultNetwork: NetworkInfo;

  /**
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
   *  chainID: 'columbus-4',
   *  lcd: 'https://lcd.terra.dev',
   * }
   *
   * const testnet: NetworkInfo = {
   *  name: 'testnet',
   *  chainID: 'tequila-0004',
   *  lcd: 'https://tequila-lcd.terra.dev',
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
  private webExtension: WebExtensionController | null = null;
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
      if (extensionType === ConnectType.WEBEXTENSION) {
        this._availableConnectTypes.next([
          ConnectType.READONLY,
          ConnectType.WEBEXTENSION,
          ConnectType.WALLETCONNECT,
        ]);

        this.webExtension = new WebExtensionController(window);

        const subscription = this.webExtension
          .status()
          .pipe(
            filter((webExtensionStatus) => {
              return (
                webExtensionStatus.type !== WebExtensionStatusType.INITIALIZING
              );
            }),
          )
          .subscribe((webExtensionStatus) => {
            subscription.unsubscribe();

            if (
              webExtensionStatus.type === WebExtensionStatusType.READY &&
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
    } else if (type === ConnectType.WEBEXTENSION) {
      const webExtensionStatus = this.webExtension?.getLastStatus();
      if (
        webExtensionStatus?.type === WebExtensionStatusType.NO_AVAILABLE &&
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
      case ConnectType.WEBEXTENSION:
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
    txTarget: { network?: NetworkInfo; terraAddress?: string } = {},
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
        if (!this.webExtension) {
          reject(new Error(`webExtension instance not created!`));
          return;
        }

        const webExtensionStates = this.webExtension.getLastStates();

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

        const subscription = this.webExtension
          .post({
            terraAddress: focusedWallet.terraAddress,
            network:
              { ...webExtensionStates.network, ...txTarget.network } ??
              webExtensionStates.network,
            tx,
          })
          .subscribe({
            next: (
              extensionTxResult: WebExtensionTxProgress | WebExtensionTxSucceed,
            ) => {
              switch (extensionTxResult.status) {
                case WebExtensionTxStatus.SUCCEED:
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
              if (error instanceof WebExtensionUserDenied) {
                reject(new UserDenied());
              } else if (error instanceof WebExtensionCreateTxFailed) {
                reject(new CreateTxFailed(tx, error.message));
              } else if (error instanceof WebExtensionTxFailed) {
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

    if (this.disableWebExtension || !this.webExtension) {
      return;
    }

    const extensionSubscription = combineLatest([
      this.webExtension.status(),
      this.webExtension.states(),
    ]).subscribe(([status, states]) => {
      if (!states) {
        return;
      }

      if (status.type === WebExtensionStatusType.READY) {
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
                connectType: ConnectType.WEBEXTENSION,
                terraAddress: focusedWallet.terraAddress,
                design: focusedWallet.design,
              },
            ],
          });
        }
      } else if (status.type === WebExtensionStatusType.NO_AVAILABLE) {
        localStorage.removeItem(WEB_EXTENSION_CONNECTED_KEY);
        this.updateStates(this._notConnected);

        if (!status.isApproved && this.disableWebExtension) {
          this.disableWebExtension();
        }
      }
    });

    localStorage.setItem(WEB_EXTENSION_CONNECTED_KEY, 'true');

    const lastExtensionStatus = this.webExtension.getLastStatus();

    if (
      lastExtensionStatus.type === WebExtensionStatusType.NO_AVAILABLE &&
      lastExtensionStatus.isApproved === false
    ) {
      this.webExtension.requestApproval();
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

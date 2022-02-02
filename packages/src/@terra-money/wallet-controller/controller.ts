import {
  AccAddress,
  CreateTxOptions,
  LCDClient,
  PublicKey,
  Tx,
} from '@terra-money/terra.js';
import {
  ConnectedWallet,
  Connection,
  ConnectType,
  Installation,
  NetworkInfo,
  SignBytesResult,
  SignResult,
  TxResult,
  WalletLCDClientConfig,
  WalletStates,
  WalletStatus,
} from '@terra-money/wallet-types';
import {
  TerraWebExtensionFeatures,
  WebExtensionTxStatus,
} from '@terra-money/web-extension-interface';
import deepEqual from 'fast-deep-equal';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  Observable,
  Subscription,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  CHROME_EXTENSION_INSTALL_URL,
  DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK,
} from './env';
import {
  mapExtensionSignBytesError,
  mapExtensionTxError,
} from './exception/mapExtensionTxError';
import { mapWalletConnectError } from './exception/mapWalletConnectError';
import { selectConnection } from './modules/connect-modal';
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
  WalletConnectSessionStatus,
} from './modules/walletconnect';
import { getExtensions } from './operators/getExtensions';
import { toConnectedWallet } from './operators/toConnectedWallet';
import { toLcdClient } from './operators/toLcdClient';
import { isDesktopChrome } from './utils/browser-check';
import { checkExtensionReady } from './utils/checkExtensionReady';
import { sortConnections } from './utils/sortConnections';

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
   * run at executing the `connect()` - only used when does not input ConnectType
   */
  selectConnection?: (
    connections: Connection[],
  ) => Promise<[type: ConnectType, identifier: string | undefined] | null>;

  /**
   * run at executing the `connect(ConnectType.EXTENSION)`
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
    icon: 'https://assets.terra.money/icon/wallet-provider/readonly.svg',
  } as Connection,
  [ConnectType.WALLETCONNECT]: {
    type: ConnectType.WALLETCONNECT,
    name: 'Wallet Connect',
    icon: 'https://assets.terra.money/icon/wallet-provider/walletconnect.svg',
  } as Connection,
} as const;

const DEFAULT_WAITING_CHROME_EXTENSION_INSTALL_CHECK = 1000 * 3;

const WALLETCONNECT_SUPPORT_FEATURES = new Set<TerraWebExtensionFeatures>([
  'post',
]);

const EMPTY_SUPPORT_FEATURES = new Set<TerraWebExtensionFeatures>();

//noinspection ES6MissingAwait
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
        DEFAULT_WAITING_CHROME_EXTENSION_INSTALL_CHECK,
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

  /**
   * Some mobile wallet emulates the behavior of chrome extension.
   * It confirms that the current connection environment is such a wallet.
   * (If you are running connect() by checking availableConnectType, you do not need to use this API.)
   *
   * @see Wallet#isChromeExtensionCompatibleBrowser
   */
  isChromeExtensionCompatibleBrowser = (): boolean => {
    return (
      this.options.dangerously__chromeExtensionCompatibleBrowserCheck ??
      DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK
    )(navigator.userAgent);
  };

  /**
   * available connect types on the browser
   *
   * @see Wallet#availableConnectTypes
   */
  availableConnectTypes = (): Observable<ConnectType[]> => {
    return this._availableConnectTypes.asObservable();
  };

  /**
   * available connections includes identifier, name, icon
   *
   * @see Wallet#availableConnections
   */
  availableConnections = (): Observable<Connection[]> => {
    return this._availableConnectTypes.pipe(
      map((connectTypes) => {
        const connections: Connection[] = [];

        for (const connectType of connectTypes) {
          if (connectType === ConnectType.EXTENSION) {
            const terraExtensions = getTerraExtensions();

            for (const terraExtension of terraExtensions) {
              connections.push(
                memoConnection(
                  ConnectType.EXTENSION,
                  terraExtension.name,
                  terraExtension.icon,
                  terraExtension.identifier,
                ),
              );
            }
          } else {
            connections.push(CONNECTIONS[connectType]);
          }
        }

        return sortConnections(connections);
      }),
    );
  };

  /**
   * available install types on the browser
   *
   * in this time, this only contains [ConnectType.EXTENSION]
   *
   * @see Wallet#availableInstallTypes
   */
  availableInstallTypes = (): Observable<ConnectType[]> => {
    return this._availableInstallTypes.asObservable();
  };

  /**
   * available installations includes identifier, name, icon, url
   *
   * @see Wallet#availableInstallations
   */
  availableInstallations = (): Observable<Installation[]> => {
    return combineLatest([this.availableConnections(), getExtensions()]).pipe(
      map(([connections, extensions]) => {
        const installedIdentifiers = new Set<string>(
          connections
            .filter(({ type, identifier }) => {
              return type === ConnectType.EXTENSION && !!identifier;
            })
            .map(({ identifier }) => {
              return identifier!;
            }),
        );

        return extensions
          .filter(({ identifier }) => {
            return !installedIdentifiers.has(identifier);
          })
          .map(({ name, identifier, icon, url }) => {
            return {
              type: ConnectType.EXTENSION,
              identifier,
              name,
              icon,
              url,
            };
          });
      }),
    );
  };

  /**
   * @see Wallet#status
   * @see Wallet#network
   * @see Wallet#wallets
   */
  states = (): Observable<WalletStates> => {
    return this._states.asObservable();
  };

  /** get connectedWallet */
  connectedWallet = (): Observable<ConnectedWallet | undefined> => {
    return this._states.pipe(toConnectedWallet(this));
  };

  /** get lcdClient */
  lcdClient = (
    lcdClientConfig?: WalletLCDClientConfig,
  ): Observable<LCDClient> => {
    return this._states.pipe(toLcdClient(lcdClientConfig));
  };

  /**
   * reload the connected wallet states
   *
   * in this time, this only work on the ConnectType.EXTENSION
   *
   * @see Wallet#recheckStatus
   */
  refetchStates = () => {
    if (this.disableExtension) {
      this.extension?.refetchStates();
    }
  };

  /**
   * @deprecated Please use availableInstallations
   *
   * install for the connect type
   *
   * @see Wallet#install
   */
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

  /**
   * connect to wallet
   *
   * @see Wallet#connect
   */
  connect = async (_type?: ConnectType, _identifier?: string) => {
    let type: ConnectType;
    let identifier: string | undefined;

    if (!!_type) {
      type = _type;
      identifier = _identifier;
    } else {
      const connections = await firstValueFrom(this.availableConnections());
      const selector = this.options.selectConnection ?? selectConnection;
      const selected = await selector(connections);

      if (!selected) {
        return;
      }

      type = selected[0];
      identifier = selected[1];
    }

    switch (type) {
      case ConnectType.READONLY:
        const networks: NetworkInfo[] = Object.keys(
          this.options.walletConnectChainIds,
        ).map((chainId) => this.options.walletConnectChainIds[+chainId]);

        const createReadonlyWalletSession =
          this.options.createReadonlyWalletSession?.(networks) ??
          readonlyWalletModal({ networks });

        const readonlyWalletSession = await createReadonlyWalletSession;

        if (readonlyWalletSession) {
          this.enableReadonlyWallet(reConnect(readonlyWalletSession));
        }
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

  /**
   * manual connect to read only session
   *
   * @see Wallet#connectReadonly
   */
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
            reject(mapExtensionTxError(tx, error));
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
          throw mapWalletConnectError(tx, error);
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
            reject(mapExtensionTxError(tx, error));
            subscription.unsubscribe();
          },
        });
      });
    }

    throw new Error(`sign() method only available on extension`);
  };

  /**
   * @see Wallet#signBytes
   * @param bytes
   * @param terraAddress only available new extension
   */
  signBytes = async (
    bytes: Buffer,
    terraAddress?: string,
  ): Promise<SignBytesResult> => {
    if (this.disableExtension) {
      return new Promise<SignBytesResult>((resolve, reject) => {
        if (!this.extension) {
          reject(new Error(`extension instance is not created!`));
          return;
        }

        const subscription = this.extension
          .signBytes(bytes, terraAddress)
          .subscribe({
            next: (txResult) => {
              if (txResult.status === WebExtensionTxStatus.SUCCEED) {
                resolve({
                  result: {
                    recid: txResult.payload.recid,
                    signature: Uint8Array.from(
                      Buffer.from(txResult.payload.signature, 'base64'),
                    ),
                    public_key: txResult.payload.public_key
                      ? PublicKey.fromData(txResult.payload.public_key)
                      : undefined,
                  },
                  success: true,
                });
                subscription.unsubscribe();
              }
            },
            error: (error) => {
              reject(mapExtensionSignBytesError(bytes, error));
              subscription.unsubscribe();
            },
          });
      });
    }

    throw new Error(`signBytes() method only available on extension`);
    // TODO implements signBytes() to other connect types
  };

  /**
   * @see Wallet#hasCW20Tokens
   * @param chainID
   * @param tokenAddrs Token addresses
   */
  hasCW20Tokens = async (
    chainID: string,
    ...tokenAddrs: string[]
  ): Promise<{ [tokenAddr: string]: boolean }> => {
    if (this.availableExtensionFeature('cw20-token')) {
      return this.extension!.hasCW20Tokens(chainID, ...tokenAddrs);
    }

    throw new Error(`Does not support hasCW20Tokens() on this connection`);
  };

  /**
   * @see Wallet#addCW20Tokens
   * @param chainID
   * @param tokenAddrs Token addresses
   */
  addCW20Tokens = async (
    chainID: string,
    ...tokenAddrs: string[]
  ): Promise<{ [tokenAddr: string]: boolean }> => {
    if (this.availableExtensionFeature('cw20-token')) {
      return this.extension!.addCW20Tokens(chainID, ...tokenAddrs);
    }

    throw new Error(`Does not support addCW20Tokens() on this connection`);
  };

  /**
   * @see Wallet#hasNetwork
   * @param network
   */
  hasNetwork = (network: Omit<NetworkInfo, 'name'>): Promise<boolean> => {
    if (this.availableExtensionFeature('network')) {
      return this.extension!.hasNetwork(network);
    }

    throw new Error(`Does not support hasNetwork() on this connection`);
  };

  /**
   * @see Wallet#hasNetwork
   * @param network
   */
  addNetwork = (network: NetworkInfo): Promise<boolean> => {
    if (this.availableExtensionFeature('network')) {
      return this.extension!.addNetwork(network);
    }

    throw new Error(`Does not support addNetwork() on this connection`);
  };

  // ================================================================
  // internal
  // connect type changing
  // ================================================================
  private availableExtensionFeature = (feature: TerraWebExtensionFeatures) => {
    if (this.disableExtension && this.extension) {
      const states = this.extension.getLastStates();

      return (
        states.type === ExtensionRouterStatus.WALLET_CONNECTED &&
        states.supportFeatures.has(feature)
      );
    }
  };

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
      supportFeatures: EMPTY_SUPPORT_FEATURES,
      connection: CONNECTIONS.READONLY,
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
            supportFeatures: extensionStates.supportFeatures,
            connection: memoConnection(
              ConnectType.EXTENSION,
              extensionStates.extensionInfo.name,
              extensionStates.extensionInfo.icon,
              extensionStates.extensionInfo.identifier,
            ),
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
                supportFeatures: WALLETCONNECT_SUPPORT_FEATURES,
                connection: CONNECTIONS.WALLETCONNECT,
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

const memoizedConnections = new Map<string, Connection>();

function memoConnection(
  connectType: ConnectType,
  name: string,
  icon: string,
  identifier: string | undefined = '',
): Connection {
  const key = [connectType, name, icon, identifier].join(';');

  if (memoizedConnections.has(key)) {
    return memoizedConnections.get(key)!;
  }

  const connection: Connection = {
    type: connectType,
    name,
    icon,
    identifier,
  };

  memoizedConnections.set(key, connection);

  return connection;
}

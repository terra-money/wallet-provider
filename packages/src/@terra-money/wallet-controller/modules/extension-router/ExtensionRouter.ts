import { NetworkInfo } from '@terra-money/wallet-types';
import {
  TerraWebExtensionConnector,
  WebExtensionNetworkInfo,
  WebExtensionPostPayload,
  WebExtensionSignBytesPayload,
  WebExtensionSignPayload,
  WebExtensionStates,
  WebExtensionStatus,
  WebExtensionTxResult,
} from '@terra-money/web-extension-interface';
import { CreateTxOptions } from '@terra-money/terra.js';
import { BehaviorSubject, Subscribable } from 'rxjs';
import { LegacyExtensionConnector } from '../legacy-extension';
import { selectModal } from './modal';
import { ExtensionInfo, getTerraExtensions } from './multiChannel';
import { clearSession, getStoredSession, storeSession } from './session';
import {
  ExtensionRouterConnectorType,
  ExtensionRouterStates,
  ExtensionRouterStatus,
} from './types';

export interface ExtensionRouterOptions {
  defaultNetwork: NetworkInfo;
  selectExtension?: (
    extensionInfos: ExtensionInfo[],
  ) => Promise<ExtensionInfo | null>;

  hostWindow?: Window;

  // ---------------------------------------------
  // development features
  // ---------------------------------------------
  dangerously__chromeExtensionCompatibleBrowserCheck: (
    userAgent: string,
  ) => boolean;
}

export class ExtensionRouter {
  private readonly _states: BehaviorSubject<ExtensionRouterStates>;
  private readonly _extensionInfos: ExtensionInfo[];

  private _connector: TerraWebExtensionConnector | null = null;

  constructor(private readonly options: ExtensionRouterOptions) {
    this._states = new BehaviorSubject<ExtensionRouterStates>({
      type: ExtensionRouterStatus.INITIALIZING,
      network: options.defaultNetwork,
    });

    this._extensionInfos = getTerraExtensions();

    if (this._extensionInfos.length === 0) {
      this._states.next({
        type: ExtensionRouterStatus.NO_AVAILABLE,
        network: options.defaultNetwork,
        isConnectorExists: false,
      });

      return;
    }

    // ---------------------------------------------
    // initialize session
    // ---------------------------------------------
    const session = getStoredSession();

    if (session) {
      const extensionInfo = this._extensionInfos.find(
        (item) => item.identifier === session.identifier,
      );

      if (extensionInfo) {
        this.createConnector(extensionInfo);
        return;
      } else {
        console.warn(
          `Can't find an extension for the session "${session.identifier}"`,
        );
        clearSession();

        this._states.next({
          type: ExtensionRouterStatus.WALLET_NOT_CONNECTED,
          network: options.defaultNetwork,
        });
      }
    } else {
      this._states.next({
        type: ExtensionRouterStatus.WALLET_NOT_CONNECTED,
        network: options.defaultNetwork,
      });
    }
  }

  // ---------------------------------------------
  // states
  // ---------------------------------------------
  states = () => {
    return this._states.asObservable();
  };

  getLastStates = () => {
    return this._states.getValue();
  };

  // ---------------------------------------------
  // behaviors
  // ---------------------------------------------
  connect = async (identifier?: string) => {
    const extensionInfos = getTerraExtensions();

    if (extensionInfos.length === 0) {
      throw new Error(`[ExtensionRouter] Can't find connectors`);
    }

    let extensionInfo: ExtensionInfo | undefined;

    if (identifier) {
      extensionInfo = extensionInfos.find(
        (item) => item.identifier === identifier,
      );
    } else if (extensionInfos.length === 1) {
      extensionInfo = extensionInfos[0];
    } else {
      const select = this.options.selectExtension ?? selectModal;
      const selectedExtensionInfo = await select(extensionInfos);

      if (selectedExtensionInfo) {
        extensionInfo = selectedExtensionInfo;
      }
    }

    if (extensionInfo) {
      this.createConnector(extensionInfo);
    }
  };

  disconnect = () => {
    clearSession();

    this._states.next({
      type: ExtensionRouterStatus.WALLET_NOT_CONNECTED,
      network: this.options.defaultNetwork,
    });

    this._connector?.close();
    this._connector = null;
  };

  requestApproval = () => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    }

    this._connector.requestApproval();
  };

  refetchStates = () => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    }

    this._connector.refetchStates();
  };

  post = (
    tx: CreateTxOptions,
    terraAddress?: string,
  ): Subscribable<WebExtensionTxResult<WebExtensionPostPayload>> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    }

    const latestStates = this.getLastStates();

    if (latestStates.type !== ExtensionRouterStatus.WALLET_CONNECTED) {
      throw new Error(`[ExtensionRouter] Wallet is not connected`);
    }

    return this._connector.post(
      terraAddress ?? latestStates.wallet.terraAddress,
      tx,
    );
  };

  sign = (
    tx: CreateTxOptions,
    terraAddress?: string,
  ): Subscribable<WebExtensionTxResult<WebExtensionSignPayload>> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    }

    const latestStates = this.getLastStates();

    if (latestStates.type !== ExtensionRouterStatus.WALLET_CONNECTED) {
      throw new Error(`[ExtensionRouter] Wallet is not connected`);
    }

    return this._connector.sign(
      terraAddress ?? latestStates.wallet.terraAddress,
      tx,
    );
  };

  signBytes = (
    bytes: Buffer,
    terraAddress?: string,
  ): Subscribable<WebExtensionTxResult<WebExtensionSignBytesPayload>> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    }

    const latestStates = this.getLastStates();

    if (latestStates.type !== ExtensionRouterStatus.WALLET_CONNECTED) {
      throw new Error(`[ExtensionRouter] Wallet is not connected`);
    }

    return this._connector.signBytes(
      terraAddress ?? latestStates.wallet.terraAddress,
      bytes,
    );
  };

  hasCW20Tokens = (
    chainID: string,
    ...tokenAddrs: string[]
  ): Promise<{ [tokenAddr: string]: boolean }> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    } else if (this._connector instanceof LegacyExtensionConnector) {
      throw new Error(
        '[ExtensionRouter] Legacy extension does not support hasCW20Tokens() ',
      );
    }

    return this._connector.hasCW20Tokens(chainID, ...tokenAddrs);
  };

  addCW20Tokens = (
    chainID: string,
    ...tokenAddrs: string[]
  ): Promise<{ [tokenAddr: string]: boolean }> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    } else if (this._connector instanceof LegacyExtensionConnector) {
      throw new Error(
        '[ExtensionRouter] Legacy extension does not support addCW20Tokens() ',
      );
    }

    return this._connector.addCW20Tokens(chainID, ...tokenAddrs);
  };

  hasNetwork = (
    network: Omit<WebExtensionNetworkInfo, 'name'>,
  ): Promise<boolean> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    } else if (this._connector instanceof LegacyExtensionConnector) {
      throw new Error(
        '[ExtensionRouter] Legacy extension does not support hasNetwork() ',
      );
    }

    return this._connector.hasNetwork(network);
  };

  addNetwork = (network: WebExtensionNetworkInfo): Promise<boolean> => {
    if (!this._connector) {
      throw new Error('[ExtensionRouter] No connector');
    } else if (this._connector instanceof LegacyExtensionConnector) {
      throw new Error(
        '[ExtensionRouter] Legacy extension does not support addNetwork() ',
      );
    }

    return this._connector.addNetwork(network);
  };

  // ---------------------------------------------
  // internal
  // ---------------------------------------------
  private createConnector = (extensionInfo: ExtensionInfo) => {
    this._connector?.close();

    const connectorPromise: Promise<TerraWebExtensionConnector> =
      extensionInfo.connector
        ? Promise.resolve(extensionInfo.connector())
        : Promise.resolve(
            new LegacyExtensionConnector(extensionInfo.identifier),
          );

    connectorPromise.then((connector) => {
      connector.open(this.options.hostWindow ?? window, {
        next: (nextStates: WebExtensionStates) => {
          if (nextStates.type === WebExtensionStatus.INITIALIZING) {
            this._states.next({
              type: ExtensionRouterStatus.INITIALIZING,
              network: this.options.defaultNetwork,
            });
          } else if (nextStates.type === WebExtensionStatus.NO_AVAILABLE) {
            this._states.next({
              type: ExtensionRouterStatus.NO_AVAILABLE,
              network: this.options.defaultNetwork,
              isConnectorExists: true,
              isApproved: nextStates.isApproved,
            });
          } else if (nextStates.wallets.length === 0) {
            this._states.next({
              type: ExtensionRouterStatus.WALLET_NOT_CONNECTED,
              network: nextStates.network,
            });
          } else {
            this._states.next({
              type: ExtensionRouterStatus.WALLET_CONNECTED,
              network: nextStates.network,
              wallet: nextStates.focusedWalletAddress
                ? nextStates.wallets.find(
                    (itemWallet) =>
                      itemWallet.terraAddress ===
                      nextStates.focusedWalletAddress,
                  ) ?? nextStates.wallets[0]
                : nextStates.wallets[0],
              connectorType:
                connector instanceof LegacyExtensionConnector
                  ? ExtensionRouterConnectorType.LEGACY
                  : ExtensionRouterConnectorType.WEB_EXTENSION,
              supportFeatures: new Set(connector.supportFeatures()),
              extensionInfo,
            });
          }
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {},
      });

      this._connector = connector;

      storeSession({
        identifier: extensionInfo.identifier,
      });
    });
  };
}

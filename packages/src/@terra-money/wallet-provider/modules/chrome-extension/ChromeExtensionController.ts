import { AccAddress } from '@terra-money/terra.js';
import { NetworkInfo } from '@terra-money/use-wallet';
import { BehaviorSubject } from 'rxjs';
import { isDesktopChrome } from '../../utils/browser-check';
import { defaultSelectModal } from './defaultSelectModal';
import { extensionFixer, FixedExtension } from './extensionFixer';
import { ChromeExtensionInfo, getTerraChromeExtensions } from './multiChannel';
import { clearSession, getStoredSession, storeSession } from './storage';
import { ChromeExtensionStatus } from './types';

export interface ChromeExtensionControllerOptions {
  defaultNetwork: NetworkInfo;
  enableWalletConnection: boolean;
  dangerously__chromeExtensionCompatibleBrowserCheck: (
    userAgent: string,
  ) => boolean;
  selectExtension?: (
    extensionInfos: ChromeExtensionInfo[],
  ) => Promise<ChromeExtensionInfo | null>;
}

export class ChromeExtensionController {
  readonly _status: BehaviorSubject<ChromeExtensionStatus>;
  readonly _networkInfo: BehaviorSubject<NetworkInfo>;
  readonly _terraAddress: BehaviorSubject<string | null>;
  private _extension: FixedExtension | null = null;

  private readonly extensionInfos: ChromeExtensionInfo[];
  private readonly isDesktopChrome: boolean;

  constructor(readonly options: ChromeExtensionControllerOptions) {
    this.isDesktopChrome =
      typeof window !== 'undefined' &&
      isDesktopChrome(
        options.dangerously__chromeExtensionCompatibleBrowserCheck(
          navigator.userAgent,
        ),
      );

    this._status = new BehaviorSubject<ChromeExtensionStatus>(
      this.isDesktopChrome
        ? ChromeExtensionStatus.INITIALIZING
        : ChromeExtensionStatus.UNAVAILABLE,
    );

    this._networkInfo = new BehaviorSubject<NetworkInfo>(
      options.defaultNetwork,
    );

    this.extensionInfos = getTerraChromeExtensions();

    if (!this.isDesktopChrome) {
      this._terraAddress = new BehaviorSubject<string | null>(null);
      return;
    }

    // ---------------------------------------------
    // initialize session
    // ---------------------------------------------
    if (this.extensionInfos.length === 0) {
      this._terraAddress = new BehaviorSubject<string | null>(null);
      this._status.next(ChromeExtensionStatus.UNAVAILABLE);
      return;
    }

    const session = getStoredSession();

    if (
      !session ||
      !this.extensionInfos.some(
        (item) => item.identifier === session.identifier,
      )
    ) {
      this._terraAddress = new BehaviorSubject<string | null>(null);
      this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
      return;
    }

    this._terraAddress = new BehaviorSubject<string | null>(
      session.walletAddress,
    );

    this._extension = extensionFixer(session.identifier);

    this.checkStatus();
  }

  status = () => {
    return this._status.asObservable();
  };

  networkInfo = () => {
    return this._networkInfo.asObservable();
  };

  terraAddress = () => {
    return this._terraAddress.asObservable();
  };

  checkStatus = async () => {
    // do not check if browser isn't a chrome
    if (!this.isDesktopChrome) {
      return;
    }

    if (this.extensionInfos.length === 0) {
      this._status.next(ChromeExtensionStatus.UNAVAILABLE);
      return;
    }

    if (!this._extension) {
      this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
      return;
    }

    // get networkInfo from extension
    const infoPayload = await this._extension.info();

    if (
      infoPayload &&
      this._networkInfo.getValue().chainID !== infoPayload.chainID
    ) {
      this._networkInfo.next(infoPayload);
    }

    if (this.options.enableWalletConnection) {
      //const storageStoredWalletAddress: string | null = getStoredAddress();
      const session = getStoredSession();

      // if the storage has wallet address
      if (session && AccAddress.validate(session.walletAddress)) {
        this._status.next(ChromeExtensionStatus.WALLET_CONNECTED);

        const connectResult = await this._extension.connect();

        // if address of extension is not same with the address of localStorage
        if (
          connectResult.address &&
          AccAddress.validate(connectResult.address)
        ) {
          storeSession({
            walletAddress: connectResult.address,
            identifier: session.identifier,
          });
        }

        if (!!connectResult.address) {
          if (this._terraAddress.getValue() !== connectResult.address) {
            this._terraAddress.next(connectResult.address);
          }
        } else {
          clearSession();
          this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
        }
      } else {
        if (session) {
          clearSession();
        }

        this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
        this._terraAddress.next(null);
      }
    } else {
      this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
      this._terraAddress.next(null);
    }
  };

  connect = async (identifier?: string) => {
    const extensionInfos = getTerraChromeExtensions();

    if (extensionInfos.length === 0) {
      return false;
    }

    let extensionInfo: ChromeExtensionInfo | undefined;

    if (identifier) {
      extensionInfo = extensionInfos.find(
        (item) => item.identifier === identifier,
      );
    } else if (extensionInfos.length === 1) {
      extensionInfo = extensionInfos[0];
    } else {
      const select = this.options.selectExtension ?? defaultSelectModal;
      const selection = await select(extensionInfos);

      if (selection) {
        extensionInfo = selection;
      }
    }

    if (extensionInfo) {
      this._extension = extensionFixer(extensionInfo.identifier);

      const result = await this._extension.connect();

      if (result?.address) {
        const walletAddress: string = result.address;

        storeSession({
          identifier: extensionInfo.identifier,
          walletAddress,
        });

        await this.checkStatus();

        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  disconnect = () => {
    clearSession();

    this._status.next(ChromeExtensionStatus.WALLET_NOT_CONNECTED);
    this._terraAddress.next(null);
    this._extension = null;
  };

  recheckStatus = () => {
    if (this._extension && !this._extension.inTransactionProgress()) {
      this.checkStatus();
    }
  };

  post = <SendData extends {}, Payload extends {}>(
    data: SendData,
  ): Promise<{ name: string; payload: Payload }> => {
    if (!this._extension) {
      throw new Error(`There is no connected wallet`);
    }
    return this._extension.post(data);
  };

  sign = <SendData extends {}, Payload extends {}>(
    data: SendData,
  ): Promise<{ name: string; payload: Payload }> => {
    if (!this._extension) {
      throw new Error(`There is no connected wallet`);
    }
    return this._extension.sign(data);
  };

  signBytes = <Payload extends {}>(
    bytes: Buffer,
  ): Promise<{ name: string; payload: Payload }> => {
    if (!this._extension) {
      throw new Error(`There is no connected wallet`);
    }
    return this._extension.signBytes(bytes);
  };
}

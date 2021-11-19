import {
  TerraWebExtensionConnector,
  WebExtensionCreateTxFailed,
  WebExtensionPostPayload,
  WebExtensionSignPayload,
  WebExtensionStates,
  WebExtensionStatus,
  WebExtensionTxFailed,
  WebExtensionTxResult,
  WebExtensionTxStatus,
  WebExtensionTxUnspecifiedError,
} from '@terra-dev/web-extension-interface';
import { AccAddress, CreateTxOptions } from '@terra-money/terra.js';
import { NetworkInfo } from '@terra-money/use-wallet';
import { BehaviorSubject, Observer, Subscribable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { createFixedExtension, FixedExtension } from './createFixedExtension';
import {
  ChromeExtensionCreateTxFailed,
  ChromeExtensionTxFailed,
  ChromeExtensionUnspecifiedError,
} from './errors';

export class ChromeExtensionConnector implements TerraWebExtensionConnector {
  private _states: BehaviorSubject<WebExtensionStates>;
  private _extension: FixedExtension;
  private hostWindow: Window | null = null;
  private statesSubscription: Subscription | null = null;

  constructor(private identifier: string) {
    this._states = new BehaviorSubject<WebExtensionStates>({
      type: WebExtensionStatus.INITIALIZING,
    });

    this._extension = createFixedExtension(identifier);
  }

  open = (hostWindow: Window, statesObserver: Observer<WebExtensionStates>) => {
    this.hostWindow = hostWindow;
    this.statesSubscription = this._states
      .pipe(
        filter(
          (states: WebExtensionStates | null): states is WebExtensionStates =>
            !!states,
        ),
      )
      .subscribe(statesObserver);

    this.refetchStates();
  };

  close = () => {
    this._extension.disconnect();
  };

  requestApproval = () => {
    this.recheckStates();
  };

  refetchStates = () => {
    this.recheckStates();
  };

  post = (
    terraAddress: string,
    tx: CreateTxOptions,
  ): Subscribable<WebExtensionTxResult<WebExtensionPostPayload>> => {
    const subject = new BehaviorSubject<
      WebExtensionTxResult<WebExtensionPostPayload>
    >({
      status: WebExtensionTxStatus.PROGRESS,
    });

    this._extension
      .post(tx)
      .then(({ result }) => {
        subject.next({
          status: WebExtensionTxStatus.SUCCEED,
          payload: result,
        });
        subject.complete();
      })
      .catch((error) => {
        if (error instanceof ChromeExtensionCreateTxFailed) {
          subject.error(new WebExtensionCreateTxFailed(error.message));
        } else if (error instanceof ChromeExtensionTxFailed) {
          subject.error(
            new WebExtensionTxFailed(error.txhash, error.message, null),
          );
        } else if (error instanceof ChromeExtensionUnspecifiedError) {
          subject.error(new WebExtensionTxUnspecifiedError(error.message));
        }
        // UserDenied - chrome extension will sent original UserDenied error type
        // All unspecified errors...
        subject.error(error);
      });

    return subject.asObservable();
  };

  sign = (
    terraAddress: string,
    tx: CreateTxOptions,
  ): Subscribable<WebExtensionTxResult<WebExtensionSignPayload>> => {
    const subject = new BehaviorSubject<
      WebExtensionTxResult<WebExtensionSignPayload>
    >({
      status: WebExtensionTxStatus.PROGRESS,
    });

    this._extension
      .sign(tx)
      .then(({ result }) => {
        subject.next({
          status: WebExtensionTxStatus.SUCCEED,
          payload: result,
        });
        subject.complete();
      })
      .catch((error) => {
        if (error instanceof ChromeExtensionCreateTxFailed) {
          subject.error(new WebExtensionCreateTxFailed(error.message));
        } else if (error instanceof ChromeExtensionTxFailed) {
          subject.error(
            new WebExtensionTxFailed(error.txhash, error.message, null),
          );
        } else if (error instanceof ChromeExtensionUnspecifiedError) {
          subject.error(new WebExtensionTxUnspecifiedError(error.message));
        }
        // UserDenied - chrome extension will sent original UserDenied error type
        // All unspecified errors...
        subject.error(error);
      });

    return subject.asObservable();
  };

  hasCW20Tokens = () => {
    throw new Error(
      '[LegacyExtensionConnector] does not support hasCW20Tokens()',
    );
  };

  addCW20Tokens = () => {
    throw new Error(
      '[LegacyExtensionConnector] does not support addCW20Tokens()',
    );
  };

  hasNetwork = () => {
    throw new Error('[LegacyExtensionConnector] does not support hasNetwork()');
  };

  addNetwork = () => {
    throw new Error('[LegacyExtensionConnector] does not support addNetwork()');
  };

  // ---------------------------------------------
  // internal
  // ---------------------------------------------
  recheckStates = async () => {
    if (this._extension.inTransactionProgress()) {
      return;
    }

    const infoResult: NetworkInfo = await this._extension.info();
    const connectResult: { address?: string } = await this._extension.connect();

    if (connectResult.address && AccAddress.validate(connectResult.address)) {
      this._states.next({
        type: WebExtensionStatus.READY,
        network: infoResult,
        focusedWalletAddress: connectResult.address,
        wallets: [
          {
            name: '',
            terraAddress: connectResult.address,
            design: 'terra',
          },
        ],
      });
    } else {
      this._states.next({
        type: WebExtensionStatus.READY,
        network: infoResult,
        focusedWalletAddress: undefined,
        wallets: [],
      });
    }
  };
}

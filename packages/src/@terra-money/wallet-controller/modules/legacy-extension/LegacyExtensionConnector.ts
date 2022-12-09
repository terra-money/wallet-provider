import { NetworkInfo } from '@terra-money/wallet-types';
import {
  TerraWebExtensionConnector,
  TerraWebExtensionFeatures,
  WebExtensionPostPayload,
  WebExtensionSignBytesPayload,
  WebExtensionSignPayload,
  WebExtensionStates,
  WebExtensionStatus,
  WebExtensionTxResult,
  WebExtensionTxStatus,
} from '@terra-money/web-extension-interface';
import { AccAddress, CreateTxOptions } from '@terra-money/feather.js';
import { BehaviorSubject, Observer, Subscribable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { createFixedExtension, FixedExtension } from './createFixedExtension';

const supportFeatures: TerraWebExtensionFeatures[] = [
  'post',
  'sign',
  'sign-bytes',
];

export class LegacyExtensionConnector implements TerraWebExtensionConnector {
  private _states: BehaviorSubject<WebExtensionStates>;
  private _extension: FixedExtension;
  private hostWindow: Window | null = null;
  private statesSubscription: Subscription | null = null;

  supportFeatures() {
    return supportFeatures;
  }

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
    address: AccAddress,
    tx: CreateTxOptions,
  ): Subscribable<WebExtensionTxResult<WebExtensionPostPayload>> => {
    const subject = new BehaviorSubject<
      WebExtensionTxResult<WebExtensionPostPayload>
    >({
      status: WebExtensionTxStatus.PROGRESS,
    });

    this._extension
      .post(tx)
      .then(({ payload }) => {
        subject.next({
          status: WebExtensionTxStatus.SUCCEED,
          payload: payload.result,
        });
        subject.complete();
      })
      .catch((error) => subject.error(error));

    return subject.asObservable();
  };

  sign = (
    address: AccAddress,
    tx: CreateTxOptions,
  ): Subscribable<WebExtensionTxResult<WebExtensionSignPayload>> => {
    const subject = new BehaviorSubject<
      WebExtensionTxResult<WebExtensionSignPayload>
    >({
      status: WebExtensionTxStatus.PROGRESS,
    });

    this._extension
      .sign(tx)
      .then(({ payload }) => {
        subject.next({
          status: WebExtensionTxStatus.SUCCEED,
          payload: payload.result,
        });
        subject.complete();
      })
      .catch((error) => subject.error(error));

    return subject.asObservable();
  };

  signBytes = (
    bytes: Buffer,
  ): Subscribable<WebExtensionTxResult<WebExtensionSignBytesPayload>> => {
    const subject = new BehaviorSubject<
      WebExtensionTxResult<WebExtensionSignBytesPayload>
    >({
      status: WebExtensionTxStatus.PROGRESS,
    });

    this._extension
      .signBytes(bytes)
      .then(({ payload }) => {
        subject.next({
          status: WebExtensionTxStatus.SUCCEED,
          payload: {
            recid: payload.result.recid,
            signature: payload.result.signature,
            public_key: {
              '@type': '/cosmos.crypto.secp256k1.PubKey',
              'key': payload.result.public_key,
            },
          },
        });
      })
      .catch((error) => subject.error(error));

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
    const connectResult: { addresses?: Record<string, AccAddress> } = await this._extension.connect();

    if (connectResult.addresses && !Object.values(connectResult.addresses).map(address => AccAddress.validate(address)).some(isValid => !isValid)) {
      this._states.next({
        type: WebExtensionStatus.READY,
        network: infoResult,
        focusedWalletAddress: connectResult.addresses[Object.values(infoResult)[0].chainID],
        wallets: [
          {
            name: '',
            addresses: connectResult.addresses,
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

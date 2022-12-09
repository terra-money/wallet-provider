import type { CreateTxOptions } from '@terra-money/feather.js';
import type { Observer, Subscribable } from 'rxjs';
import type { WebExtensionNetworkInfo } from './models/network';
import type { WebExtensionStates } from './models/states';
import type {
  WebExtensionPostPayload,
  WebExtensionSignBytesPayload,
  WebExtensionSignPayload,
  WebExtensionTxResult,
} from './models/tx';

export type TerraWebExtensionFeatures =
  | 'post'
  | 'sign'
  | 'sign-bytes'
  | 'cw20-token'
  | 'network';

export interface TerraWebExtensionConnector {
  supportFeatures: () => TerraWebExtensionFeatures[];

  // ---------------------------------------------
  // open / close
  // ---------------------------------------------
  open: (
    hostWindow: Window,
    statesObserver: Observer<WebExtensionStates>,
  ) => void;

  close: () => void;

  // ---------------------------------------------
  // commands
  // ---------------------------------------------
  requestApproval: () => void;

  refetchStates: () => void;

  post: (
    address: string,
    tx: CreateTxOptions,
  ) => Subscribable<WebExtensionTxResult<WebExtensionPostPayload>>;

  sign: (
    address: string,
    tx: CreateTxOptions,
  ) => Subscribable<WebExtensionTxResult<WebExtensionSignPayload>>;

  signBytes: (
    bytes: Buffer,
  ) => Subscribable<WebExtensionTxResult<WebExtensionSignBytesPayload>>;

  hasCW20Tokens: (
    chainID: string,
    ...tokenAddrs: string[]
  ) => Promise<{ [tokenAddr: string]: boolean }>;

  addCW20Tokens: (
    chainID: string,
    ...tokenAddrs: string[]
  ) => Promise<{ [tokenAddr: string]: boolean }>;

  hasNetwork: (
    network: Omit<WebExtensionNetworkInfo, 'name'>,
  ) => Promise<boolean>;

  addNetwork: (network: WebExtensionNetworkInfo) => Promise<boolean>;
}

import type { WebExtensionNetworkInfo } from './network';
import type { WebExtensionWalletInfo } from './wallet';

export enum WebExtensionStatus {
  INITIALIZING = 'initializing',
  NO_AVAILABLE = 'no_available',
  READY = 'ready',
}

export interface WebExtensionInitializing {
  type: WebExtensionStatus.INITIALIZING;
}

export interface WebExtensionNoAvailable {
  type: WebExtensionStatus.NO_AVAILABLE;
  isConnectorExists: boolean;
  isApproved?: boolean;
}

export interface WebExtensionReady {
  type: WebExtensionStatus.READY;
  focusedWalletAddress: string | undefined;
  wallets: WebExtensionWalletInfo[];
  network: WebExtensionNetworkInfo;
}

export type WebExtensionStates =
  | WebExtensionInitializing
  | WebExtensionNoAvailable
  | WebExtensionReady;

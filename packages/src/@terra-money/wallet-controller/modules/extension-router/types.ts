import {
  TerraWebExtensionFeatures,
  WebExtensionNetworkInfo,
  WebExtensionWalletInfo,
} from '@terra-money/web-extension-interface';
import { ExtensionInfo } from './multiChannel';

export enum ExtensionRouterConnectorType {
  LEGACY = 'LEGACY',
  WEB_EXTENSION = 'WEB_EXTENSION',
}

export enum ExtensionRouterStatus {
  INITIALIZING = 'INITIALIZING',
  NO_AVAILABLE = 'NO_AVAILABLE',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTED = 'WALLET_CONNECTED',
}

export interface ExtensionRouterInitializing {
  type: ExtensionRouterStatus.INITIALIZING;
  network: WebExtensionNetworkInfo;
}

export interface ExtensionRouterNoAvailable {
  type: ExtensionRouterStatus.NO_AVAILABLE;
  network: WebExtensionNetworkInfo;
  isConnectorExists: boolean;
  isApproved?: boolean;
}

export interface ExtensionRouterWalletNotConnected {
  type: ExtensionRouterStatus.WALLET_NOT_CONNECTED;
  network: WebExtensionNetworkInfo;
}

export interface ExtensionRouterWalletConnected {
  type: ExtensionRouterStatus.WALLET_CONNECTED;
  network: WebExtensionNetworkInfo;
  wallet: WebExtensionWalletInfo;
  connectorType: ExtensionRouterConnectorType;
  supportFeatures: Set<TerraWebExtensionFeatures>;
  extensionInfo: ExtensionInfo;
}

export type ExtensionRouterStates =
  | ExtensionRouterInitializing
  | ExtensionRouterNoAvailable
  | ExtensionRouterWalletNotConnected
  | ExtensionRouterWalletConnected;

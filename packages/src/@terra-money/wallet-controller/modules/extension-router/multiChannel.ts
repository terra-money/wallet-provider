import { TerraWebExtensionConnector } from '@terra-money/web-extension-interface';

export interface ExtensionInfo {
  name: string;
  identifier: string;
  icon: string;
  connector?: () =>
    | TerraWebExtensionConnector
    | Promise<TerraWebExtensionConnector>;
}

declare global {
  interface Window {
    interchainWallets: ExtensionInfo[] | undefined;
  }
}

export function getTerraExtensions(): ExtensionInfo[] {
  return Array.isArray(window.interchainWallets)
    ? window.interchainWallets
    : window.isStationExtensionAvailable
    ? [
        {
          name: 'Terra Station',
          identifier: 'station',
          icon: 'https://assets.terra.money/icon/wallet-provider/station.svg',
        },
      ]
    : [];
}

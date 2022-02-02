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
    terraWallets: ExtensionInfo[] | undefined;
  }
}

export function getTerraExtensions(): ExtensionInfo[] {
  return Array.isArray(window.terraWallets)
    ? window.terraWallets
    : window.isTerraExtensionAvailable
    ? [
        {
          name: 'Terra Station',
          identifier: 'station',
          icon: 'https://assets.terra.money/icon/wallet-provider/station.svg',
        },
      ]
    : [];
}

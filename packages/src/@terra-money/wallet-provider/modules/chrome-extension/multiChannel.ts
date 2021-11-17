export interface ChromeExtensionInfo {
  name: string;
  identifier: string;
  icon: string;
}

declare global {
  interface Window {
    terraWallets: ChromeExtensionInfo[] | undefined;
  }
}

export function getTerraChromeExtensions(): ChromeExtensionInfo[] {
  return Array.isArray(window.terraWallets)
    ? window.terraWallets
    : window.isTerraExtensionAvailable
    ? [
        {
          name: 'Terra Station',
          identifier: 'station',
          icon: 'https://assets.terra.money/icon/station-extension/icon.png',
        },
      ]
    : [];
}

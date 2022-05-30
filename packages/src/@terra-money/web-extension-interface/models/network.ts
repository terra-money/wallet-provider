/**
 * @example
 * name: 'mainnet',
 * chainID: 'columbus-5',
 * lcd: 'https://lcd.terra.dev'
 * api: 'https://columbus-api.terra.dev',
 * mantle: 'https://columbus-mantle.terra.dev',
 * walletconnectID: 2
 */
export interface WebExtensionNetworkInfo {
  name: string;
  chainID: string;
  lcd: string;
  api?: string;
  mantle?: string;
  walleconnectID: number;
}

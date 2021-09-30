import { NetworkInfo } from '@terra-dev/wallet-types';
import { USBDeviceInfo } from './USBDeviceInfo';

export interface LedgerWalletInfo {
  terraAddress: string;
  usbDevice: USBDeviceInfo;
}

export interface LedgerWalletSession extends LedgerWalletInfo {
  network: NetworkInfo;
}

import { AccAddress } from '@terra-money/terra.js';

export const storage = typeof window === 'undefined' ? undefined : localStorage;

export const WALLET_ADDRESS: string =
  '__terra_chrome_extension_wallet_address__';

export function getStoredAddress(): string | null {
  const address = storage?.getItem(WALLET_ADDRESS);
  return address && AccAddress.validate(address) ? address : null;
}

export function storeAddress(address: string) {
  if (!AccAddress.validate(address)) {
    throw new Error(`${address} is invalidate terra address!`);
  }

  storage && storage.setItem(WALLET_ADDRESS, address);
}

export function clearStore() {
  storage && storage.removeItem(WALLET_ADDRESS);
}

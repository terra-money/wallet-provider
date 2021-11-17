import { AccAddress } from '@terra-money/terra.js';

export const storage = typeof window === 'undefined' ? undefined : localStorage;

//export const WALLET_ADDRESS: string =
//  '__terra_chrome_extension_wallet_address__';

interface Session {
  identifier: string;
  walletAddress: string;
}

export const SESSION: string = '__terra_chrome_extension_session__';

export function getStoredSession(): Session | undefined {
  const data = storage?.getItem(SESSION);

  if (!data) {
    return undefined;
  }

  try {
    const object = JSON.parse(data);

    if (
      'identifier' in object &&
      'walletAddress' in object &&
      AccAddress.validate(object['walletAddress'])
    ) {
      return {
        identifier: object['identifier'],
        walletAddress: object['walletAddress'],
      };
    } else {
      storage?.removeItem(SESSION);
      return undefined;
    }
  } catch {
    storage?.removeItem(SESSION);
    return undefined;
  }
}

export function storeSession(session: Session) {
  if (!AccAddress.validate(session.walletAddress)) {
    throw new Error(`${session.walletAddress} is invalid terra address!`);
  }

  storage?.setItem(SESSION, JSON.stringify(session));
}

export function clearSession() {
  storage?.removeItem(SESSION);
}

//export function getStoredAddress(): string | null {
//  const address = storage?.getItem(WALLET_ADDRESS);
//  return address && AccAddress.validate(address) ? address : null;
//}
//
//export function storeAddress(address: string) {
//  if (!AccAddress.validate(address)) {
//    throw new Error(`${address} is invalidate terra address!`);
//  }
//
//  storage && storage.setItem(WALLET_ADDRESS, address);
//}
//
//export function clearStore() {
//  storage && storage.removeItem(WALLET_ADDRESS);
//}

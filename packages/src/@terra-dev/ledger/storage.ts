import { LedgerWalletSession } from '@terra-dev/ledger/models/LedgerWalletSession';
import { AccAddress } from '@terra-money/terra.js';

const STORAGE_KEY = '__terra-ledger-wallet-storage-key__';

export function getStoredSession(): LedgerWalletSession | undefined {
  const storedSessionString = localStorage.getItem(STORAGE_KEY);

  if (!storedSessionString) return undefined;

  try {
    const storedSession = JSON.parse(storedSessionString);

    if (
      'terraAddress' in storedSession &&
      'network' in storedSession &&
      'usbDevice' in storedSession &&
      typeof storedSession['terraAddress'] === 'string' &&
      AccAddress.validate(storedSession.terraAddress)
    ) {
      return storedSession;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
}

export function storeSession(session: LedgerWalletSession) {
  if (!AccAddress.validate(session.terraAddress)) {
    throw new Error(`${session.terraAddress} is not a terraAddress`);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

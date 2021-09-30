import {
  ledgerWalletConnectModal,
  LedgerWalletModalOptions,
} from '@terra-dev/ledger/components/LedgerWalletConnectModal';
import { LedgerWalletSession } from '@terra-dev/ledger/models/LedgerWalletSession';
import { LedgerWalletTxResult } from '@terra-dev/ledger/models/LedgerWalletTxResult';
import { getStoredSession } from '@terra-dev/ledger/storage';
import { CreateTxOptions } from '@terra-money/terra.js';

export interface LedgerWalletController {
  session: LedgerWalletSession;
  post: (tx: CreateTxOptions) => Promise<LedgerWalletTxResult>;
}

export async function connectIfSessionExists(): Promise<LedgerWalletController | null> {
  const storedSession = getStoredSession();

  if (!!storedSession) {
    return connect({ session: storedSession });
  }

  return null;
}

type ConnectOption =
  | { session: LedgerWalletSession }
  | LedgerWalletModalOptions;

export async function connect(
  options: ConnectOption,
): Promise<LedgerWalletController | null> {
  async function post(tx: CreateTxOptions): Promise<LedgerWalletTxResult> {
    throw new Error('not implemented!');
  }

  if ('session' in options) {
    return {
      session: options.session,
      post,
    };
  }

  if (!('networks' in options)) {
    throw new Error(`connect({networks}) is required!`);
  }

  return ledgerWalletConnectModal(options).then((session) => {
    return session ? { session, post } : null;
  });
}

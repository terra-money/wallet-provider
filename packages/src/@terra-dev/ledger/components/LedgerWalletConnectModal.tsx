import { LedgerWalletSession } from '@terra-dev/ledger/models/LedgerWalletSession';
import { NetworkInfo } from '@terra-dev/wallet-types';

export interface LedgerWalletModalOptions {
  networks: NetworkInfo[];
  className?: string;
}

export function ledgerWalletConnectModal({
  networks,
  className,
}: LedgerWalletModalOptions): Promise<LedgerWalletSession | null> {
  return new Promise<LedgerWalletSession | null>((resolve) => {
  
  });
}

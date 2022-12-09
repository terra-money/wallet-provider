import {
  createLCDClient,
  WalletStates,
} from '@terra-money/wallet-types';
import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';
import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';

export function toLcdClient(
  lcdClientConfig: Record<string, LCDClientConfig>,
): OperatorFunction<WalletStates, LCDClient> {
  return map<WalletStates, LCDClient>((states) => {
    return createLCDClient(lcdClientConfig);
  });
}

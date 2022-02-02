import {
  ConnectedWallet,
  createConnectedWallet,
  WalletStates,
  WalletStatus,
} from '@terra-money/wallet-types';
import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { WalletController } from '../controller';

export function toConnectedWallet(
  controller: WalletController,
): OperatorFunction<WalletStates, ConnectedWallet | undefined> {
  return map<WalletStates, ConnectedWallet | undefined>((states) => {
    if (states.status === WalletStatus.WALLET_CONNECTED) {
      return createConnectedWallet({
        connection: states.connection,
        network: states.network,
        wallets: states.wallets,
        post: controller.post,
        sign: controller.sign,
        signBytes: controller.signBytes,
        supportFeatures: states.supportFeatures,
        status: states.status,
      });
    }
    return undefined;
  });
}

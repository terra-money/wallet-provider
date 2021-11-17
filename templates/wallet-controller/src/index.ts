import { Fee, LCDClient, MsgSend } from '@terra-money/terra.js';
import {
  ConnectType,
  CreateTxFailed,
  getChainOptions,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  UserDenied,
  WalletController,
  WalletStatus,
} from '@terra-money/wallet-provider';
import { combineLatest } from 'rxjs';

(async () => {
  const chainOptions = await getChainOptions();

  const controller = new WalletController({
    ...chainOptions,
  });

  const toAddress = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

  combineLatest([
    controller.availableConnectTypes(),
    controller.availableInstallTypes(),
    controller.states(),
  ]).subscribe(([availableConnectTypes, availableInstallTypes, states]) => {
    // ---------------------------------------------
    // connect
    // ---------------------------------------------
    const connectContainer = document.querySelector('#connect-sample')!;
    const connectPre = connectContainer.querySelector('section > pre')!;
    const connectFooter = connectContainer.querySelector('footer')!;

    if (connectPre) {
      connectPre.textContent = JSON.stringify(
        {
          availableConnectTypes,
          availableInstallTypes,
          states,
        },
        null,
        2,
      );
    }

    connectFooter.innerHTML = '';

    switch (states.status) {
      case WalletStatus.WALLET_NOT_CONNECTED:
        for (const installType of availableInstallTypes) {
          const button = document.createElement('button');
          button.textContent = `Install ${installType}`;
          button.addEventListener('click', () => {
            controller.install(installType);
          });
          connectFooter.appendChild(button);
        }

        for (const connectType of availableConnectTypes) {
          const button = document.createElement('button');
          button.textContent = `Connect ${connectType}`;
          button.addEventListener('click', () => {
            controller.connect(connectType);
          });
          connectFooter.appendChild(button);
        }
        break;
      case WalletStatus.WALLET_CONNECTED:
        const button = document.createElement('button');
        button.textContent = `Disconnect`;
        button.addEventListener('click', () => {
          controller.disconnect();
        });
        connectFooter.appendChild(button);
        break;
    }

    // ---------------------------------------------
    // query
    // ---------------------------------------------
    const queryContainer = document.querySelector('#query-sample')!;
    const queryPre = queryContainer.querySelector('section > pre')!;

    switch (states.status) {
      case WalletStatus.WALLET_NOT_CONNECTED:
        queryPre.textContent = 'Wallet not connected!';
        break;
      case WalletStatus.WALLET_CONNECTED:
        const lcd = new LCDClient({
          URL: states.network.lcd,
          chainID: states.network.chainID,
        });

        lcd.bank.balance(states.wallets[0].terraAddress).then((coins) => {
          queryPre.textContent = coins.toString();
        });
    }

    // ---------------------------------------------
    // tx
    // ---------------------------------------------
    const txContainer = document.querySelector('#tx-sample')!;
    const txPre = txContainer.querySelector('section > pre')!;
    const txFooter = txContainer.querySelector('footer')!;

    txFooter.innerHTML = '';

    switch (states.status) {
      case WalletStatus.WALLET_NOT_CONNECTED:
        txPre.textContent = `Wallet not connected`;
        break;
      case WalletStatus.WALLET_CONNECTED:
        if (states.wallets[0].connectType === ConnectType.READONLY) {
          txPre.textContent = `Can't post Tx!`;
        } else {
          txPre.textContent = '';

          const send = () => {
            if (states.network.chainID.startsWith('columbus')) {
              alert(`Please only execute this example on Testnet`);
              return;
            }

            controller
              .post({
                fee: new Fee(1000000, '200000uusd'),
                msgs: [
                  new MsgSend(states.wallets[0].terraAddress, toAddress, {
                    uusd: 1000000,
                  }),
                ],
              })
              .then((nextTxResult: TxResult) => {
                txPre.textContent = JSON.stringify(nextTxResult, null, 2);
              })
              .catch((error: unknown) => {
                if (error instanceof UserDenied) {
                  txPre.textContent = 'User Denied';
                } else if (error instanceof CreateTxFailed) {
                  txPre.textContent = 'Create Tx Failed: ' + error.message;
                } else if (error instanceof TxFailed) {
                  txPre.textContent = 'Tx Failed: ' + error.message;
                } else if (error instanceof Timeout) {
                  txPre.textContent = 'Timeout';
                } else if (error instanceof TxUnspecifiedError) {
                  txPre.textContent = 'Unspecified Error: ' + error.message;
                } else {
                  txPre.textContent =
                    'Unknown Error: ' +
                    (error instanceof Error ? error.message : String(error));
                }
              });
          };

          const button = document.createElement('button');
          button.textContent = `Send 1USD to ${toAddress}`;
          button.addEventListener('click', () => {
            send();
          });
          txFooter.appendChild(button);
        }
        break;
    }
  });
})();

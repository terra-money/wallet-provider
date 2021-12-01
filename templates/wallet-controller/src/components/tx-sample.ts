import { WalletStatus } from '@terra-dev/wallet-types';
import { Fee, MsgSend } from '@terra-money/terra.js';
import {
  CreateTxFailed,
  NetworkInfo,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  UserDenied,
  WalletController,
  WalletInfo,
} from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { html, render } from 'lit-html';

const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

export function runTxSample() {
  const controller = getController();
  const element = document.querySelector('#tx-sample') as HTMLElement;

  controller.states().subscribe((states) => {
    if (states.status === WalletStatus.WALLET_CONNECTED) {
      if (!states.supportFeatures.has('post')) {
        render(
          html`
            <h1>Tx Sample</h1>
            <p>This connection does not support post()</p>
          `,
          element,
        );
      } else {
        txSample(controller, element, states.wallets[0], states.network);
      }
    } else {
      render(
        html`
          <h1>Tx Sample</h1>
          <p>Wallet not connected!</p>
        `,
        element,
      );
    }
  });
}

const txSample = (
  controller: WalletController,
  element: HTMLElement,
  wallet: WalletInfo,
  network: NetworkInfo,
) => {
  let txResult: TxResult | null = null;
  let txError: string | null = null;

  function proceed() {
    if (network.chainID.startsWith('columbus')) {
      alert(`Please only execute this example on Testnet`);
      return;
    }

    controller
      .post({
        fee: new Fee(1000000, '200000uusd'),
        msgs: [
          new MsgSend(wallet.terraAddress, TEST_TO_ADDRESS, {
            uusd: 1000000,
          }),
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        txResult = nextTxResult;

        refresh();
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          txError = 'User Denied';
        } else if (error instanceof CreateTxFailed) {
          txError = 'Create Tx Failed: ' + error.message;
        } else if (error instanceof TxFailed) {
          txError = 'Tx Failed: ' + error.message;
        } else if (error instanceof Timeout) {
          txError = 'Timeout';
        } else if (error instanceof TxUnspecifiedError) {
          txError = 'Unspecified Error: ' + error.message;
        } else {
          txError =
            'Unknown Error: ' +
            (error instanceof Error ? error.message : String(error));
        }

        refresh();
      });
  }

  function refresh() {
    if (txResult) {
      render(
        html`
          <h1>Tx Sample</h1>
          <pre>${JSON.stringify(txResult, null, 2)}</pre>
          <div>
            <a
              href="https://finder.terra.money/${network.chainID}/tx/${txResult
                .result.txhash}"
              target="_blank"
              rel="noreferrer"
              >Open Tx Result in Terra Finder</a
            >
          </div>
          <button
            @click="${() => {
              txResult = null;
              txError = null;
              refresh();
            }}"
          >
            Clear result
          </button>
        `,
        element,
      );
    } else if (txError) {
      render(
        html`
          <h1>Tx Sample</h1>
          <pre>${txError}</pre>
          <button
            @click="${() => {
              txResult = null;
              txError = null;
              refresh();
            }}"
          >
            Clear result
          </button>
        `,
        element,
      );
    } else {
      render(
        html`
          <h1>Tx Sample</h1>
          <button @click="${proceed}">Send 1USD to ${TEST_TO_ADDRESS}</button>
        `,
        element,
      );
    }
  }

  refresh();
};

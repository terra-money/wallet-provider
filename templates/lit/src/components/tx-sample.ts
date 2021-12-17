import { Fee, MsgSend } from '@terra-money/terra.js';
import {
  ConnectedWallet,
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  UserDenied,
} from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

@customElement('tx-sample-form')
export class FormRenderer extends LitElement {
  @property()
  connectedWallet!: ConnectedWallet;

  @state()
  txResult: TxResult | null = null;

  @state()
  txError: string | null = null;

  render() {
    if (this.txResult) {
      return html`
        <pre>${JSON.stringify(this.txResult, null, 2)}</pre>
        <div>
          <a
            href="https://finder.terra.money/${this.connectedWallet.network
              .chainID}/tx/${this.txResult.result.txhash}"
            target="_blank"
            rel="noreferrer"
            >Open Tx Result in Terra Finder</a
          >
        </div>
        <button @click="${this.clearResult}">Clear result</button>
      `;
    } else if (this.txError) {
      return html`
        <pre>${this.txError}</pre>
        <button @click="${this.clearResult}">Clear error</button>
      `;
    } else {
      return html`
        <button @click="${this.proceed}">
          Send 1USD to ${TEST_TO_ADDRESS}
        </button>
      `;
    }
  }

  proceed = () => {
    if (this.connectedWallet.network.chainID.startsWith('columbus')) {
      alert(`Please only execute this example on Testnet`);
      return;
    }

    this.connectedWallet
      .post({
        fee: new Fee(1000000, '200000uusd'),
        msgs: [
          new MsgSend(this.connectedWallet.terraAddress, TEST_TO_ADDRESS, {
            uusd: 1000000,
          }),
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        this.txResult = nextTxResult;
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          this.txError = 'User Denied';
        } else if (error instanceof CreateTxFailed) {
          this.txError = 'Create Tx Failed: ' + error.message;
        } else if (error instanceof TxFailed) {
          this.txError = 'Tx Failed: ' + error.message;
        } else if (error instanceof Timeout) {
          this.txError = 'Timeout';
        } else if (error instanceof TxUnspecifiedError) {
          this.txError = 'Unspecified Error: ' + error.message;
        } else {
          this.txError =
            'Unknown Error: ' +
            (error instanceof Error ? error.message : String(error));
        }
      });
  };

  clearResult = () => {
    this.txResult = null;
    this.txError = null;
  };
}

@customElement('tx-sample')
export class TxSample extends LitElement {
  @state()
  content: TemplateResult = html`<p>Initializing...</p>`;

  subscription: Subscription | null = null;

  render() {
    return html`
      <h1>Tx Sample</h1>
      ${this.content}
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    const controller = getController();

    this.subscription = controller
      .connectedWallet()
      .subscribe((connectedWallet) => {
        if (connectedWallet) {
          if (!connectedWallet.availablePost) {
            this.content = html`<p>This connection does not support post()</p>`;
          } else {
            this.content = html`<tx-sample-form
              .connectedWallet=${connectedWallet}
            ></tx-sample-form>`;
          }
        } else {
          this.content = html`<p>Wallet not connected!</p>`;
        }
      });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tx-sample': TxSample;
  }
}

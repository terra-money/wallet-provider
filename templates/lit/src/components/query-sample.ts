import { Coins } from '@terra-money/terra.js';
import {
  ConnectedWallet,
  createLCDClient,
} from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('query-sample')
export class QuerySample extends LitElement {
  @state()
  connectedWallet: ConnectedWallet | undefined;

  @state()
  balance: Coins | null = null;

  subscription: Subscription | null = null;

  render() {
    if (!this.connectedWallet) {
      return html`
        <h1>Query Sample</h1>
        <p>Wallet not connected!</p>
      `;
    }

    return html`
      <h1>Query Sample</h1>
      <pre>${this.balance?.toString()}</pre>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    const controller = getController();

    this.subscription = controller
      .connectedWallet()
      .subscribe((connectedWallet) => {
        this.connectedWallet = connectedWallet;

        if (connectedWallet) {
          const lcd = createLCDClient({ network: connectedWallet.network });

          lcd.bank.balance(connectedWallet.terraAddress).then(([coins]) => {
            this.balance = coins;
          });
        } else {
          this.balance = null;
        }
      });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
    this.connectedWallet = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'query-sample': QuerySample;
  }
}

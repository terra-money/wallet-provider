import { WalletStatus } from '@terra-dev/wallet-types';
import { Coins, LCDClient } from '@terra-money/terra.js';
import { getController } from 'controller';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('query-sample')
export class QuerySample extends LitElement {
  @state()
  connected: boolean = false;

  @state()
  balance: Coins | null = null;

  subscription: Subscription | null = null;

  render() {
    if (!this.connected) {
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

    this.subscription = controller.states().subscribe((states) => {
      if (states.status === WalletStatus.WALLET_CONNECTED) {
        this.connected = true;

        const lcd = new LCDClient({
          URL: states.network.lcd,
          chainID: states.network.chainID,
        });

        lcd.bank.balance(states.wallets[0].terraAddress).then(([coins]) => {
          this.balance = coins;
        });
      } else {
        this.connected = false;
        this.balance = null;
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
    'query-sample': QuerySample;
  }
}

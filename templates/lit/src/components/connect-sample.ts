import {
  Connection,
  ConnectType,
  WalletStates,
  WalletStatus,
} from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { combineLatest, Subscription } from 'rxjs';

@customElement('connect-sample')
export class ConnectSample extends LitElement {
  @state()
  availableConnectTypes: ConnectType[] = [];

  @state()
  availableInstallTypes: ConnectType[] = [];

  @state()
  availableConnections: Connection[] = [];

  @state()
  states: WalletStates | null = null;

  @state()
  supportFeatures: string[] = [];

  controller = getController();

  subscription: Subscription | null = null;

  render() {
    if (!this.states) {
      return html`<div>Initializing...</div>`;
    }

    const data = JSON.stringify(
      {
        availableConnectTypes: this.availableConnectTypes,
        availableInstallTypes: this.availableInstallTypes,
        availableConnections: this.availableConnections,
        states: this.states,
        supportFeatures: this.supportFeatures,
      },
      null,
      2,
    );

    let footer: TemplateResult;

    switch (this.states.status) {
      case WalletStatus.WALLET_NOT_CONNECTED:
        footer = html`
          ${this.availableInstallTypes.map(
            (connectType) =>
              html`<button
                @click="${() => this.controller.install(connectType)}"
              >
                Install ${connectType}
              </button>`,
          )}
          ${this.availableConnectTypes.map(
            (connectType) =>
              html`<button
                @click="${() => this.controller.connect(connectType)}"
              >
                Connect ${connectType}
              </button>`,
          )}
          <br />
          ${this.availableConnections.map(
            ({ type, name, icon, identifier = '' }) =>
              html`<button
                @click="${() => this.controller.connect(type, identifier)}"
              >
                <img
                  src="${icon}"
                  alt="${name}"
                  style="width: 1em; height: 1em;"
                />
                ${name} [${identifier}]
              </button>`,
          )}
        `;
        break;
      case WalletStatus.WALLET_CONNECTED:
        footer = html`
          <button @click="${() => this.controller.disconnect()}">
            Disconnect
          </button>
        `;
        break;
      default:
        footer = html``;
    }

    return html`
      <h1>Connect Sample</h1>
      <section>
        <pre>${data}</pre>
      </section>
      <footer>${footer}</footer>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    this.subscription = combineLatest([
      this.controller.availableConnectTypes(),
      this.controller.availableInstallTypes(),
      this.controller.availableConnections(),
      this.controller.states(),
    ]).subscribe(
      ([
        availableConnectTypes,
        availableInstallTypes,
        availableConnections,
        states,
      ]) => {
        this.availableInstallTypes = availableInstallTypes;
        this.availableConnectTypes = availableConnectTypes;
        this.availableConnections = availableConnections;
        this.states = states;
        this.supportFeatures =
          states.status === WalletStatus.WALLET_CONNECTED
            ? Array.from(states.supportFeatures)
            : [];
      },
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connect-sample': ConnectSample;
  }
}

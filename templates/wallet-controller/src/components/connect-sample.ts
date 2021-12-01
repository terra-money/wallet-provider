import { WalletStatus } from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { html, render, TemplateResult } from 'lit-html';
import { combineLatest } from 'rxjs';

export function runConnectSample() {
  const controller = getController();
  const element = document.querySelector('#connect-sample') as HTMLElement;

  combineLatest([
    controller.availableConnectTypes(),
    controller.availableInstallTypes(),
    controller.availableConnections(),
    controller.states(),
  ]).subscribe(
    ([
      availableConnectTypes,
      availableInstallTypes,
      availableConnections,
      states,
    ]) => {
      const supportFeatures =
        states.status === WalletStatus.WALLET_CONNECTED
          ? Array.from(states.supportFeatures)
          : [];

      const json = JSON.stringify(
        {
          availableConnectTypes,
          availableInstallTypes,
          availableConnections,
          states,
          supportFeatures,
        },
        null,
        2,
      );

      let footer: TemplateResult;

      switch (states.status) {
        case WalletStatus.WALLET_NOT_CONNECTED:
          footer = html`
            ${availableInstallTypes.map(
              (connectType) =>
                html`<button @click="${() => controller.install(connectType)}">
                  Install ${connectType}
                </button>`,
            )}
            ${availableConnectTypes.map(
              (connectType) =>
                html`<button @click="${() => controller.connect(connectType)}">
                  Connect ${connectType}
                </button>`,
            )}
            <br />
            ${availableConnections.map(
              ({ type, name, icon, identifier = '' }) =>
                html`<button
                  @click="${() => controller.connect(type, identifier)}"
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
            <button @click="${() => controller.disconnect()}">
              Disconnect
            </button>
          `;
          break;
        default:
          footer = html``;
      }

      render(
        html`
          <h1>Connect Sample</h1>
          <section>
            <pre>${json}</pre>
          </section>
          <footer>${footer}</footer>
        `,
        element,
      );
    },
  );
}

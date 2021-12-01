import { WalletStatus } from '@terra-dev/wallet-types';
import { LCDClient } from '@terra-money/terra.js';
import { getController } from 'controller';
import { html, render } from 'lit-html';

export function runQuerySample() {
  const controller = getController();
  const element = document.querySelector('#query-sample') as HTMLElement;

  controller.states().subscribe((states) => {
    if (states.status === WalletStatus.WALLET_CONNECTED) {
      const lcd = new LCDClient({
        URL: states.network.lcd,
        chainID: states.network.chainID,
      });

      lcd.bank.balance(states.wallets[0].terraAddress).then(([coins]) => {
        render(
          html`
            <h1>Query Sample</h1>
            <pre>${coins.toString()}</pre>
          `,
          element,
        );
      });
    } else {
      render(
        html`
          <h1>Query Sample</h1>
          <p>Wallet not connected!</p>
        `,
        element,
      );
    }
  });
}

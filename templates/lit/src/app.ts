import { initController } from 'controller';
import { html, render } from 'lit';
import './components/connect-sample';
import './components/query-sample';
import './components/tx-sample';

const container = document.querySelector('#app') as HTMLElement;

render(html`<div>Initializing...</div>`, container);

initController().then(() => {
  render(
    html`
      <connect-sample></connect-sample>
      <query-sample></query-sample>
      <tx-sample></tx-sample>
    `,
    container,
  );
});

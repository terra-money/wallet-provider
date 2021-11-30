import { NetworkInfo } from '@terra-dev/wallet-types';
import { AccAddress } from '@terra-money/terra.js';
import { modalStyle } from './modal.style';
import { ReadonlyWalletSession } from './types';

interface Options {
  networks: NetworkInfo[];
}

export function readonlyWalletModal({
  networks,
}: Options): Promise<ReadonlyWalletSession | null> {
  return new Promise<ReadonlyWalletSession | null>((resolve) => {
    const styleContainer = document.createElement('style');
    const modalContainer = document.createElement('div');

    function onComplete(session: ReadonlyWalletSession | null) {
      resolve(session);
      styleContainer.parentElement?.removeChild(styleContainer);
      modalContainer.parentElement?.removeChild(modalContainer);
    }

    const element = createModalElement({
      networks,
      onComplete,
    });

    styleContainer.textContent = modalStyle;
    modalContainer.appendChild(element);

    document.querySelector('head')?.appendChild(styleContainer);
    document.querySelector('body')?.appendChild(modalContainer);
  });
}

function createModalElement({
  networks,
  onComplete,
}: Options & {
  onComplete: (session: ReadonlyWalletSession | null) => void;
}): HTMLElement {
  let chainID: string = networks[0].chainID;
  let address: string = '';

  // ---------------------------------------------
  // container
  // ---------------------------------------------
  const container = document.createElement('div');
  container.setAttribute('class', 'wallet-readonly-modal');

  // ---------------------------------------------
  // container > div.wallet-readonly-modal--dim
  // ---------------------------------------------
  const dim = document.createElement('div');
  dim.setAttribute('class', 'wallet-readonly-modal--dim');

  container.appendChild(dim);

  // ---------------------------------------------
  // content > div.wallet-readonly-modal--content
  // ---------------------------------------------
  const content = document.createElement('section');
  content.setAttribute('class', 'wallet-readonly-modal--content');

  container.appendChild(content);

  // h1
  const title = document.createElement('h1');
  title.textContent = 'View an Address';
  content.appendChild(title);

  // label
  const label = document.createElement('label');
  content.appendChild(label);

  // label > select
  const select = document.createElement('select');

  for (const itemNetwork of networks) {
    const option = document.createElement('option');
    option.setAttribute('value', itemNetwork.chainID);

    if (chainID === itemNetwork.chainID) {
      option.setAttribute('selected', '');
    }

    option.textContent = `${itemNetwork.name[0].toUpperCase()}${itemNetwork.name.slice(
      1,
    )} - ${itemNetwork.chainID}`;

    select.appendChild(option);
  }

  label.appendChild(select);

  // label > svg
  const svg = document.createElement('svg');
  svg.setAttribute('viewbox', '0 0 10 6');

  const polyline = document.createElement('polyline');
  polyline.setAttribute('points', '1 1 5 5 9 1');

  label.appendChild(svg);

  // input
  const input = document.createElement('input');
  input.setAttribute('type', 'text');

  content.appendChild(input);

  // button
  const button = document.createElement('button');
  button.disabled = true;
  button.textContent = 'View an Address';

  content.appendChild(button);

  // ---------------------------------------------
  // bind data
  // ---------------------------------------------
  dim.addEventListener('click', () => {
    onComplete(null);
  });

  select.addEventListener('change', (event) => {
    chainID = (event.target as HTMLSelectElement).value;
  });

  input.addEventListener('input', (event) => {
    address = (event.target as HTMLInputElement).value;

    button.disabled = !(
      AccAddress.validate(address) && button.hasAttribute('disabled')
    );
  });

  button.addEventListener('click', () => {
    const network = networks.find(
      (itemNetwork) => itemNetwork.chainID === chainID,
    );

    if (!network) {
      return;
    }

    onComplete({
      network,
      terraAddress: address,
    });
  });

  return container;
}

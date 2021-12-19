import { ExtensionInfo } from './multiChannel';
import { modalStyle } from './modal.style';

export function selectModal(
  extensionInfos: ExtensionInfo[],
): Promise<ExtensionInfo | null> {
  return new Promise<ExtensionInfo | null>((resolve) => {
    const modalContainer = document.createElement('div');
    const styleContainer = document.createElement('style');

    function onComplete(extensionInfo: ExtensionInfo | null) {
      resolve(extensionInfo);
      modalContainer.parentElement?.removeChild(modalContainer);
      styleContainer.parentElement?.removeChild(styleContainer);
    }

    const element = createModalElement({
      extensionInfos,
      onComplete,
    });

    styleContainer.textContent = modalStyle;
    modalContainer.appendChild(element);

    document.querySelector('head')?.appendChild(styleContainer);
    document.querySelector('body')?.appendChild(modalContainer);
  });
}

function createModalElement({
  extensionInfos,
  onComplete,
}: {
  extensionInfos: ExtensionInfo[];
  onComplete: (extensionInfo: ExtensionInfo | null) => void;
}): HTMLElement {
  // ---------------------------------------------
  // container
  // ---------------------------------------------
  const container = document.createElement('div');
  container.setAttribute('class', 'wallet-select-modal');

  // ---------------------------------------------
  // container > div.wallet-select-modal--dim
  // ---------------------------------------------
  const dim = document.createElement('div');
  dim.setAttribute('class', 'wallet-select-modal--dim');

  container.appendChild(dim);

  // ---------------------------------------------
  // content > div.wallet-select-modal--content
  // ---------------------------------------------
  const content = document.createElement('section');
  content.setAttribute('class', 'wallet-select-modal--content');

  container.appendChild(content);

  // h1
  const title = document.createElement('h1');
  title.textContent = 'Select a Wallet';
  content.appendChild(title);

  // ul
  const list = document.createElement('ul');
  content.appendChild(list);

  for (const extensionInfo of extensionInfos) {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.addEventListener('click', () => onComplete(extensionInfo));

    item.appendChild(button);

    const icon = document.createElement('span');
    icon.setAttribute('class', 'wallet-select-modal--icon');

    button.appendChild(icon);

    const iconImg = document.createElement('img');
    iconImg.setAttribute('src', extensionInfo.icon);
    iconImg.setAttribute(
      'alt',
      `${extensionInfo.name} [${extensionInfo.identifier}]`,
    );

    icon.appendChild(iconImg);

    const description = document.createElement('span');
    description.setAttribute('class', 'wallet-select-modal--description');
    description.textContent = extensionInfo.name;

    button.appendChild(description);

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24');

    button.appendChild(arrow);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z');

    arrow.appendChild(path);

    list.appendChild(item);
  }

  // events
  dim.addEventListener('click', () => onComplete(null));

  return container;
}

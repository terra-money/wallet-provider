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
  console.log('modal.ts..createModalElement()', extensionInfos);

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
  title.textContent = 'Select a wallet';
  content.appendChild(title);

  // ul
  const list = document.createElement('ul');
  content.appendChild(list);

  for (const extensionInfo of extensionInfos) {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.addEventListener('click', () => onComplete(extensionInfo));

    item.appendChild(button);

    const icon = document.createElement('img');
    icon.setAttribute('src', extensionInfo.icon);
    icon.setAttribute('alt', extensionInfo.name);

    button.appendChild(icon);

    const description = document.createElement('span');
    description.textContent = `${extensionInfo.name} [${extensionInfo.identifier}]`;

    button.appendChild(description);

    list.appendChild(item);
  }

  return container;
}

import { IQRCodeModal, IQRCodeModalOptions } from '@walletconnect/types';
import { toCanvas } from 'qrcode';
import { isMobile as isMobileBrowser } from '../../utils/browser-check';
import { modalStyle } from './modal.style';

export class TerraWalletconnectQrcodeModal implements IQRCodeModal {
  modalContainer: HTMLDivElement | null = null;
  styleContainer: HTMLStyleElement | null = null;

  private callback: (() => void) | null = null;

  setCloseCallback = (callback: () => void) => {
    this.callback = callback;
  };

  open = (
    uri: string,
    cb: () => void,
    _qrcodeModalOptions?: IQRCodeModalOptions,
  ) => {
    const modalContainer = document.createElement('div');
    const stylecontainer = document.createElement('style');

    const query = encodeURIComponent(
      `action=wallet_connect&payload=${encodeURIComponent(uri)}`,
    );

    const schemeUri = `https://terrastation.page.link/?link=https://terra.money?${query}&apn=money.terra.station&ibi=money.terra.station&isi=1548434735`;

    const element = createModalElement({
      schemeUri,
      onClose: () => {
        if (this.callback) {
          this.callback();
          this.callback = null;
        }
        this.close();
      },
    });

    if (isMobileBrowser()) {
      window.location.href = schemeUri;
    }

    stylecontainer.textContent = modalStyle;
    modalContainer.appendChild(element);

    document.querySelector('head')?.appendChild(stylecontainer);
    document.querySelector('body')?.appendChild(modalContainer);

    this.modalContainer = modalContainer;
    this.styleContainer = stylecontainer;
  };

  close = () => {
    if (this.modalContainer) {
      this.modalContainer.parentElement?.removeChild(this.modalContainer);
    }

    if (this.styleContainer) {
      this.styleContainer.parentElement?.removeChild(this.styleContainer);
    }

    this.callback = null;
  };
}

function createModalElement({
  schemeUri,
  className,
  onClose,
}: {
  schemeUri: string;
  className?: string;
  onClose: () => void;
}): HTMLElement {
  const isMobile = isMobileBrowser();

  const openTerraStationMobile = () => {
    window.location.href = schemeUri;
  };

  // ---------------------------------------------
  // container
  // ---------------------------------------------
  const container = document.createElement('div');
  container.setAttribute('class', 'wallet-wc-modal');

  // ---------------------------------------------
  // container > div.wallet-wc-modal--dim
  // ---------------------------------------------
  const dim = document.createElement('div');
  dim.setAttribute('class', 'wallet-wc-modal--dim');

  container.appendChild(dim);

  // ---------------------------------------------
  // container > div.wallet-wc-modal--content
  // ---------------------------------------------
  const content = document.createElement('section');
  content.setAttribute('class', 'wallet-wc-modal--content');
  content.setAttribute('data-device', isMobile ? 'mobile' : 'desktop');

  container.appendChild(content);

  // h1
  const title = document.createElement('h1');
  title.textContent = 'Wallet Connect';
  content.appendChild(title);

  if (isMobile) {
    // button
    const button = document.createElement('button');
    button.addEventListener('click', openTerraStationMobile);
    button.textContent = 'Open Terra Station Mobile';

    content.appendChild(button);
  } else {
    // qrcode
    const canvas = document.createElement('canvas');
    toCanvas(canvas, schemeUri, {
      width: 240,
    });

    content.appendChild(canvas);
  }

  return container;
}

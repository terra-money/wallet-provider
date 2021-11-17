import { ConnectType } from '@terra-money/use-wallet';

const interval = 500;

export async function checkAvailableExtension(
  timeout: number,
  isChromeExtensionCompatibleBrowser: boolean,
): Promise<ConnectType.CHROME_EXTENSION | ConnectType.WEB_CONNECT | null> {
  return new Promise<
    ConnectType.CHROME_EXTENSION | ConnectType.WEB_CONNECT | null
  >((resolve) => {
    if (isChromeExtensionCompatibleBrowser) {
      resolve(ConnectType.CHROME_EXTENSION);
      return;
    }

    const start = Date.now();

    function check() {
      const meta = window.document.querySelector(
        'head > meta[name="terra-web-connect"]',
      );

      if (typeof meta?.getAttribute('connected') === 'string') {
        resolve(ConnectType.WEB_CONNECT);
      } else if (window['isTerraExtensionAvailable'] === true) {
        resolve(ConnectType.CHROME_EXTENSION);
      } else if (Date.now() > start + timeout) {
        resolve(null);
      } else {
        setTimeout(check, interval);
      }
    }

    setTimeout(check, interval);
  });
}

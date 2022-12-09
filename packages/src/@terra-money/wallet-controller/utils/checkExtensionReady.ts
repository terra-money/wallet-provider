const interval = 500;

declare global {
  interface Window {
    isStationExtensionAvailable: boolean;
  }
}

export async function checkExtensionReady(
  timeout: number,
  isChromeExtensionCompatibleBrowser: boolean,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (isChromeExtensionCompatibleBrowser) {
      resolve(true);
      return;
    }

    const start = Date.now();

    function check() {
      if (
        window.isStationExtensionAvailable === true ||
        Array.isArray(window.interchainWallets)
      ) {
        resolve(true);
      } else if (Date.now() > start + timeout) {
        resolve(false);
      } else {
        setTimeout(check, interval);
      }
    }

    setTimeout(check, interval);
  });
}

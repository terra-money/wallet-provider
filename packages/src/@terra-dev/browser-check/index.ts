import bowser from 'bowser';
import MobileDetect from 'mobile-detect';

/**
 * @deprecated use instead of <WalletProvider dangerously__chromeExtensionCompatibleBrowserCheck={} />
 */
export function isMathWallet(userAgent: string) {
  return /MathWallet\//.test(userAgent);
}

export const isMobile = () => {
  const mobileDetect = new MobileDetect(navigator.userAgent);

  return !!mobileDetect.os();
};

export const isDesktopChrome = (
  isChromeExtensionCompatibleBrowser: boolean,
): boolean => {
  const userAgent = navigator.userAgent;

  if (isChromeExtensionCompatibleBrowser) {
    return true;
  }

  const browser = bowser.getParser(userAgent);
  const mobileDetect = new MobileDetect(navigator.userAgent);

  return !!(
    browser.satisfies({
      chrome: '>60',
      edge: '>80',
    }) && !mobileDetect.os()
  );
};

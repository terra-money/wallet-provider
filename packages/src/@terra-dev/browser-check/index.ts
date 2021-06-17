import { getParser } from 'bowser';
import MobileDetect from 'mobile-detect';

export function isMathWallet(userAgent: string) {
  return /MathWallet\//.test(userAgent);
}

export const isMobile = () => {
  const mobileDetect = new MobileDetect(navigator.userAgent);

  return !!mobileDetect.os();
};

export const isDesktopChrome = () => {
  const userAgent = navigator.userAgent;

  if (isMathWallet(userAgent)) {
    return true;
  }

  const browser = getParser(userAgent);
  const mobileDetect = new MobileDetect(navigator.userAgent);

  return (
    browser.satisfies({
      chrome: '>60',
      edge: '>80',
    }) && !mobileDetect.os()
  );
};

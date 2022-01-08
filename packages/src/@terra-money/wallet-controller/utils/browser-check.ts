import bowser from 'bowser';
import MobileDetect from 'mobile-detect';

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

export const getDesktopBrowserType = (
  userAgent: string,
): 'chrome' | 'edge' | 'firefox' | 'safari' | null => {
  const browser = bowser.getParser(userAgent);
  const mobileDetect = new MobileDetect(navigator.userAgent);

  if (!!mobileDetect.mobile()) {
    return null;
  }

  if (browser.satisfies({ chrome: '>60', chromium: '>60' })) {
    return 'chrome';
  } else if (browser.satisfies({ edge: '>80' })) {
    return 'edge';
  } else {
    return null;
  }
};

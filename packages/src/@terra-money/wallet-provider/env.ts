export const CHROME_EXTENSION_INSTALL_URL =
  'https://chrome.google.com/webstore/detail/terra-station/aiifbnbfobpmeekipheeijimdpnlpgpp';

export const WEB_EXTENSION_CONNECTED_KEY = '__terra_web_extension_connected__';

export const DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK = (
  userAgent: string,
) => {
  return /MathWallet\//.test(userAgent);
};

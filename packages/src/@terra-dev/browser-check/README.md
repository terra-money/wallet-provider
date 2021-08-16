# `@terra-dev/browser-check`

## API

<!-- source index.ts -->

[index.ts](index.ts)

```ts
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
```

<!-- /source -->

## Examples

<!-- source __tests__/useragent.test.ts -->

[\_\_tests\_\_/useragent.test.ts](__tests__/useragent.test.ts)

```ts
import { getParser } from 'bowser';

describe('browserslist', () => {
  test.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4298.0 Safari/537.36',
  ])('should be user agent is chrome (%s)', (userAgent: string) => {
    const browser = getParser(userAgent);
    expect(
      browser.satisfies({
        chrome: '>60',
      }),
    ).toBeTruthy();
  });
});
```

<!-- /source -->

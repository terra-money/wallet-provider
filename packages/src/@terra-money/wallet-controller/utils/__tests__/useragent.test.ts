import bowser from 'bowser';
import { describe, expect, test } from 'vitest';

describe('browserslist', () => {
  test('should be user agent is chrome', () => {
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4298.0 Safari/537.36',
    ].forEach((userAgent) => {
      const browser = bowser.getParser(userAgent);
      expect(
        browser.satisfies({
          chrome: '>60',
        }),
      ).toBeTruthy();
    });
  });
});

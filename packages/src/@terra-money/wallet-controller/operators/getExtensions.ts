import { Observable, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, map } from 'rxjs/operators';
import { getDesktopBrowserType } from '../utils/browser-check';

interface Extensions {
  whitelist: Array<{
    name: string;
    identifier: string;
    icon: string;
    urls: Array<{
      browser: 'chrome' | 'edge' | 'firefox' | 'safari';
      url: string;
    }>;
  }>;
}

const FALLBACK: Extensions = {
  whitelist: [
    {
      name: 'Terra Station',
      identifier: 'station',
      icon: 'https://assets.terra.money/icon/station-extension/icon.png',
      urls: [
        {
          browser: 'chrome',
          url: 'https://chrome.google.com/webstore/detail/terra-station/aiifbnbfobpmeekipheeijimdpnlpgpp',
        },
        {
          browser: 'firefox',
          url: 'https://addons.mozilla.org/en-US/firefox/addon/terra-station-wallet/',
        },
      ],
    },
    {
      name: 'XDEFI Wallet',
      identifier: 'xdefi-wallet',
      icon: 'https://xdefi-prod-common-ui.s3.eu-west-1.amazonaws.com/logo.svg',
      urls: [
        {
          browser: 'chrome',
          url: 'https://chrome.google.com/webstore/detail/xdefi-wallet/hmeobnfnfcmdkdcmlblgagmfpfboieaf',
        },
      ],
    },
  ],
};

interface InstallableExtension {
  name: string;
  identifier: string;
  icon: string;
  url: string;
}

export function getExtensions(): Observable<InstallableExtension[]> {
  const currentBrowser = getDesktopBrowserType(navigator.userAgent);

  if (!currentBrowser) {
    return of([]);
  }

  return fromFetch('https://assets.terra.money/extensions.json').pipe<
    Extensions,
    Extensions,
    InstallableExtension[]
  >(
    switchMap((res) => {
      if (res.ok) {
        return res.json();
      } else {
        return of(FALLBACK);
      }
    }),
    catchError(() => {
      return of(FALLBACK);
    }),
    map(({ whitelist }) => {
      return whitelist
        .filter(({ urls }) =>
          urls.some(({ browser }) => currentBrowser === browser),
        )
        .map(({ name, identifier, icon, urls }) => {
          return {
            name,
            identifier,
            icon,
            url: urls.find(({ browser }) => currentBrowser === browser)!.url,
          };
        });
    }),
  );
}

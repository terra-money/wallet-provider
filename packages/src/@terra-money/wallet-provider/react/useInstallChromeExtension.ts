import { ConnectType, useWallet } from '@terra-dev/use-wallet';
import { useMemo } from 'react';

export function useInstallChromeExtension() {
  const { availableInstallTypes, install } = useWallet();

  return useMemo<(() => void) | null>(() => {
    return availableInstallTypes.some(
      (type) => type === ConnectType.CHROME_EXTENSION,
    )
      ? () => install(ConnectType.CHROME_EXTENSION)
      : null;
  }, [availableInstallTypes, install]);
}

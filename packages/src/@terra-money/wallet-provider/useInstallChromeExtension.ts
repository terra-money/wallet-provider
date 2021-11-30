import { ConnectType, useWallet } from '@terra-money/use-wallet';
import { useMemo } from 'react';

export function useInstallChromeExtension() {
  const { availableInstallTypes, install } = useWallet();

  return useMemo<(() => void) | null>(() => {
    return availableInstallTypes.some((type) => type === ConnectType.EXTENSION)
      ? () => install(ConnectType.EXTENSION)
      : null;
  }, [availableInstallTypes, install]);
}

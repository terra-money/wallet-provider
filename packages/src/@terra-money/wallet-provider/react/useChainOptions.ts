import { useEffect, useState } from 'react';
import {
  getChainOptions,
  WalletControllerChainOptions,
} from '../getChainOptions';

export function useChainOptions(): WalletControllerChainOptions | null {
  const [chainOptions, setChainOptions] =
    useState<WalletControllerChainOptions | null>(null);

  useEffect(() => {
    getChainOptions().then(setChainOptions);
  }, []);

  return chainOptions;
}

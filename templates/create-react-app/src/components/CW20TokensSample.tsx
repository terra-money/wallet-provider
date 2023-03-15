import { useWallet, WalletStatus } from '@terra-money/use-wallet';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelectedChain } from './ChainSelector';

type AstroToken = {
  [key: string]: string;
  'phoenix-1': string;
  'pisco-1': string;
}

const ASTRO: AstroToken = {
  'phoenix-1': 'terra1nsuqsk6kh58ulczatwev87ttq2z6r3pusulg9r24mfj2fvtzd4uq3exn26',
  'pisco-1': 'terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv',
};

export function CW20TokensSample() {
  const { status, supportFeatures } = useWallet();

  return (
    <div>
      <h1>CW20 Tokens Sample</h1>
      {supportFeatures.has("cw20-token") ? (
        <Component />
      ) : status === WalletStatus.WALLET_CONNECTED ? (
        <p>This connection does not support CW20 commands</p>
      ) : (
        <p>Wallet not connected!</p>
      )}
    </div>
  );
}

function Component() {
  const { hasCW20Tokens, addCW20Tokens } = useWallet();
  const chainID = useSelectedChain();

  const [cw20TokensExists, setCW20TokensExists] = useState<object | null>(null);

  const isTerraChain = chainID.startsWith('phoenix-') || chainID.startsWith('pisco-');

  const availableAdd = useMemo(() => {
    return (
      cw20TokensExists &&
      isTerraChain &&
      Object.values(cw20TokensExists).some((exists) => exists === false)
    );
  }, [cw20TokensExists, isTerraChain]);

  useEffect(() => {
    hasCW20Tokens(chainID, ASTRO[chainID]).then(
      (result) => {
        setCW20TokensExists(result);
      },
    );
  }, [chainID, hasCW20Tokens]);

  const add = useCallback(() => {
    addCW20Tokens(chainID).then(
      setCW20TokensExists,
    );
  }, [addCW20Tokens, chainID]);

  return (
    <div>
      <pre>{JSON.stringify(cw20TokensExists, null, 2)}</pre>
      {availableAdd && <button onClick={add}>Add tokens</button>}
    </div>
  );
}

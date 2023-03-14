import { useWallet, WalletStatus } from '@terra-money/use-wallet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainFilter } from './ChainFilter';


export function CW20TokensSample() {
  const { status, supportFeatures } = useWallet();

  return (
    <div>
      <h1>CW20 Tokens Sample</h1>
      {supportFeatures.has('cw20-token') ? (
        <Component />
      ) : status === WalletStatus.WALLET_CONNECTED ? (
        <p>This connection does not support CW20 commands</p>
      ) : (
        <p>Wallet not connected!</p>
      )}
    </div>
  );
}

const USDC = {
  'columnbus-5': 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76',
  'bombay-12': 'terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc',
};

function Component() {
  const { network, hasCW20Tokens, addCW20Tokens } = useWallet();
  const { chainID } = useChainFilter();

  const [cw20TokensExists, setCW20TokensExists] = useState<object | null>(null);

  const availableAdd = useMemo(() => {
    return (
      cw20TokensExists &&
      Object.values(cw20TokensExists).some((exists) => exists === false)
    );
  }, [cw20TokensExists]);

  useEffect(() => {
    hasCW20Tokens(chainID).then(
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

import { useWallet, WalletStatus } from '@terra-money/use-wallet';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function CW20TokensSample() {
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

const ANC = {
  'columnbus-5': 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76',
  'bombay-12': 'terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc',
};

const BLUNA = {
  'columnbus-5': 'terra1kc87mu460fwkqte29rquh4hc20m54fxwtsx7gp',
  'bombay-12': 'terra1u0t35drzyy0mujj8rkdyzhe264uls4ug3wdp3x',
};

const BETH = {
  'columnbus-5': 'terra1dzhzukyezv0etz22ud940z7adyv7xgcjkahuun',
  'bombay-12': 'terra19mkj9nec6e3y5754tlnuz4vem7lzh4n0lc2s3l',
};

function Component() {
  const { network, hasCW20Tokens, addCW20Tokens } = useWallet();

  const [cw20TokensExists, setCW20TokensExists] = useState<object | null>(null);

  const chainID = useMemo(() => {
    return network.chainID === 'bombay-12' ? 'bombay-12' : 'columnbus-5';
  }, [network.chainID]);

  const availableAdd = useMemo(() => {
    return (
      cw20TokensExists &&
      Object.values(cw20TokensExists).some((exists) => exists === false)
    );
  }, [cw20TokensExists]);

  useEffect(() => {
    hasCW20Tokens(chainID, ANC[chainID], BLUNA[chainID], BETH[chainID]).then(
      (result) => {
        setCW20TokensExists(result);
      },
    );
  }, [chainID, hasCW20Tokens]);

  const add = useCallback(() => {
    addCW20Tokens(chainID, ANC[chainID], BLUNA[chainID], BETH[chainID]).then(
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

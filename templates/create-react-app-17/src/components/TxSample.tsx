import {  MsgSend } from '@terra-money/feather.js';
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider';
import { useCallback, useState, useMemo } from 'react';
import { useSelectedChain } from './ChainSelector';
import { getRandomAddress } from 'utils';

export function TxSample() {
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const chainID = useSelectedChain();
  const connectedWallet = useConnectedWallet();

  const toAddress = useMemo(() => {
    if (!connectedWallet?.network) return '';
    return getRandomAddress(connectedWallet.network[chainID]?.prefix);
  }, [connectedWallet, chainID]);
  
  const baseAsset = useMemo(() => {
    if (!connectedWallet?.network) return '';
    // @ts-ignore
    return connectedWallet.network[chainID].baseAsset;
  }, [connectedWallet, chainID]);

  const explorerHref = useMemo(() => {
    if (!connectedWallet || !txResult) return '';
    // @ts-ignore-line
    const { explorer } = connectedWallet.network[chainID];   
    if (explorer.tx) return explorer.tx.replace("{}", txResult.result.txhash);
  }, [connectedWallet, chainID, txResult]);

  const proceed = useCallback(() => {
    if (!connectedWallet) return
      
    const isMainnet = Object.keys(connectedWallet.network).some((key) => key.startsWith('phoenix'));

    if (isMainnet) {
      alert(`Please only execute this example on Testnet`);
      return;
    }

    setTxResult(null);
    setTxError(null);

    connectedWallet
      .post({
        chainID,
        msgs: [
          new MsgSend(connectedWallet.addresses[chainID], toAddress, {
            [baseAsset]: 1000000,
          }),
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [baseAsset, chainID, connectedWallet, toAddress]);

  return (
    <div>
      <h1>Tx Sample</h1>

      {connectedWallet?.availablePost && !txResult && !txError && (
        <button onClick={proceed}>Send 1{baseAsset} to {toAddress}</button>
      )}

      {txResult && (
        <>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>

          {explorerHref && (
            <div>
              <a
                href={explorerHref}
                target="_blank"
                rel="noreferrer"
              >
                Open Tx Result in explorer
              </a>
            </div>
          )}
        </>
      )}

      {txError && <pre>{txError}</pre>}

      {(!!txResult || !!txError) && (
        <button
          onClick={() => {
            setTxResult(null);
            setTxError(null);
          }}
        >
          Clear result
        </button>
      )}

      {!connectedWallet && <p>Wallet not connected!</p>}

      {connectedWallet && !connectedWallet.availablePost && (
        <p>This connection does not support post()</p>
      )}
    </div>
  );
}

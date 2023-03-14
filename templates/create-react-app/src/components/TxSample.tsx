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
import { useChainFilter } from './ChainFilter';
import { getBaseAsset, getRandomAddress } from 'utils';

export function TxSample() {
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const { chainID } = useChainFilter();
  const connectedWallet = useConnectedWallet();

  const toAddress = useMemo(() => {
    if (!connectedWallet) return '';
    return getRandomAddress(connectedWallet.network[chainID].prefix);
  }, [connectedWallet, chainID]);
  
  const baseAsset = useMemo(() => {
    if (!connectedWallet) return '';
    return getBaseAsset(connectedWallet.network, chainID);
  }, [connectedWallet, chainID]);

  console.log('connectedWallet.network[chainID]', connectedWallet?.network[chainID])

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

          {connectedWallet && txResult && (
            <div>
              <a
                href={`https://finder.terra.money/${connectedWallet.network.chainID}/tx/${txResult.result.txhash}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Tx Result in Terra Finder
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

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
import { getRandomAddress, ConnectedWalletNetworkInfo } from 'utils';

export function TxSample() {
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const chainID = useSelectedChain();
  const connectedWallet = useConnectedWallet();
  const network = connectedWallet?.network[chainID] as ConnectedWalletNetworkInfo

  const toAddress = useMemo(() => {
    if (!network) return ''
    return getRandomAddress(network.prefix);
  }, [network]);
  
  const baseAsset = useMemo(() => {
    if (!network) return ''
    return network.baseAsset;
  }, [network]);

  const explorerHref = useMemo(() => {
    if (!txResult) return '';
    if (network.explorer.tx) return network.explorer.tx.replace("{}", txResult.result.txhash);
  }, [network, txResult]);

  const proceed = useCallback(() => {
    if (!connectedWallet) return
      
    const isMainnet = Object.keys(connectedWallet.network).some((key) => key.startsWith('phoenix-'));

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
      {connectedWallet?.availablePost && toAddress && !txResult && !txError && (
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

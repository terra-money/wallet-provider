import { MsgSend, SyncTxBroadcastResult } from '@terra-money/feather.js';
import {
  CreateTxFailed,
  SignResult,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
  useLCDClient
} from '@terra-money/wallet-provider';
import React, { useCallback, useState, useMemo } from 'react';
import { useSelectedChain } from './ChainSelector';
import { ConnectedWalletNetworkInfo, getRandomAddress } from 'utils';

export function SignSample() {
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const [txResult, setTxResult] = useState<SyncTxBroadcastResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const chainID = useSelectedChain();
  const lcd = useLCDClient()
  const connectedWallet = useConnectedWallet();

  const network = connectedWallet?.network[chainID] as ConnectedWalletNetworkInfo
  
  const baseAsset = useMemo(() => {
    if (!network) return ''
    return network.baseAsset;
  }, [network]);

  const explorerHref = useMemo(() => {
    if (!txResult) return '';
    if (network.explorer.tx) return network.explorer.tx.replace("{}", txResult.txhash);
  }, [network, txResult]);

  const toAddress = useMemo(() => {
    if (!network) return ''
    return getRandomAddress(network.prefix);
  }, [network]);


  const send = useCallback(() => {
    if (!connectedWallet) {
      return;
    }
    const isMainnet = Object.keys(connectedWallet.network).some((key) => key.startsWith('phoenix-'));

    if (isMainnet) {
      alert(`Please only execute this example on Testnet`);
      return;
    }

    setSignResult(null);
    setTxResult(null);
    setTxError(null);

    connectedWallet
      .sign({
        chainID,
        msgs: [
          new MsgSend(connectedWallet.addresses[chainID], toAddress, {
            [baseAsset]: 1000000,
          }),
        ],
      })
      .then((nextSignResult: SignResult) => {
        setSignResult(nextSignResult);

        // broadcast
        const tx = nextSignResult.result;
        return lcd.tx.broadcastSync(tx, chainID);
      })
      .then((nextTxResult: SyncTxBroadcastResult) => {
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
  }, [connectedWallet, chainID, lcd.tx, baseAsset, toAddress]);

  return (
    <div>
      <h1>Sign Sample</h1>

      {connectedWallet?.availableSign &&
        !signResult &&
        !txResult &&
        !txError && (
          <button onClick={() => send()}>Send 1{baseAsset} to {toAddress}</button>
        )}

      {signResult && <pre>{JSON.stringify(signResult, null, 2)}</pre>}

      {txResult && (
        <>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>
          {explorerHref && (
            <a
              href={explorerHref}
              target="_blank"
              rel="noreferrer"
            >
              Open tx result in explorer
            </a>
          )}
        </>
      )}

      {txError && <pre>{txError}</pre>}

      {(!!signResult || !!txResult || !!txError) && (
        <button
          onClick={() => {
            setSignResult(null);
            setTxResult(null);
            setTxError(null);
          }}
        >
          Clear result
        </button>
      )}

      {!connectedWallet && <p>Wallet not connected!</p>}

      {connectedWallet && !connectedWallet.availableSign && (
        <p>This connection does not support sign()</p>
      )}
    </div>
  );
}

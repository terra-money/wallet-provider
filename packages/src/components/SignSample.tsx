import { Fee, MsgSend, SyncTxBroadcastResult } from '@terra-money/terra.js';
import {
  createLCDClient,
  CreateTxFailed,
  SignResult,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider';
import React, { useCallback, useState } from 'react';

const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

export function SignSample() {
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const [txResult, setTxResult] = useState<SyncTxBroadcastResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const connectedWallet = useConnectedWallet();

  const send = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    if (connectedWallet.network.chainID.startsWith('columbus')) {
      alert(`Please only execute this example on Testnet`);
      return;
    }

    setSignResult(null);
    setTxResult(null);
    setTxError(null);

    connectedWallet
      .sign({
        fee: new Fee(1000000, '200000uusd'),
        // FIXME (terra.js 2.x → terra.js 3.x)
        //fee: new StdFee(1000000, '200000uusd'),
        msgs: [
          new MsgSend(connectedWallet.walletAddress, TEST_TO_ADDRESS, {
            uusd: 1000000,
          }),
        ],
      })
      .then((nextSignResult: SignResult) => {
        setSignResult(nextSignResult);

        // FIXME (terra.js 2.x → terra.js 3.x) API changed please refer this comments
        // TODO remove after a month
        //const { signature, public_key, stdSignMsgData } = nextSignResult.result;
        //
        //const sig = StdSignature.fromData({
        //  signature,
        //  pub_key: public_key,
        //});
        //
        //const stdSignMsg = StdSignMsg.fromData(stdSignMsgData);

        // broadcast
        const tx = nextSignResult.result;

        const lcd = createLCDClient({ network: connectedWallet.network });

        // FIXME (terra.js 2.x → terra.js 3.x)
        // TODO remove after a month
        //return lcd.tx.broadcastSync(
        //  new StdTx(stdSignMsg.msgs, stdSignMsg.fee, [sig], stdSignMsg.memo),
        //);
        return lcd.tx.broadcastSync(tx);
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
  }, [connectedWallet]);

  return (
    <div>
      <h1>Sign Sample</h1>

      {connectedWallet?.availableSign &&
        !signResult &&
        !txResult &&
        !txError && (
          <button onClick={() => send()}>Send 1USD to {TEST_TO_ADDRESS}</button>
        )}

      {signResult && <pre>{JSON.stringify(signResult, null, 2)}</pre>}

      {txResult && (
        <>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>
          {connectedWallet && txResult && (
            <a
              href={`https://finder.station.money/${connectedWallet.network.chainID}/tx/${txResult.txhash}`}
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

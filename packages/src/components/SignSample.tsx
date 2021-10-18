import {
  LCDClient,
  MsgSend,
  StdFee,
  StdSignature,
  StdSignMsg,
  StdTx,
  SyncTxBroadcastResult,
} from '@terra-money/terra.js';
import {
  CreateTxFailed,
  SignResult,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider';
import React, { useCallback, useState } from 'react';

const toAddress = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

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

    connectedWallet
      .sign({
        fee: new StdFee(1000000, '200000uusd'),
        msgs: [
          new MsgSend(connectedWallet.walletAddress, toAddress, {
            uusd: 1000000,
          }),
        ],
      })
      .then((nextSignResult: SignResult) => {
        setSignResult(nextSignResult);

        // broadcast
        const { signature, public_key, stdSignMsgData } = nextSignResult.result;

        const sig = StdSignature.fromData({
          signature,
          pub_key: public_key,
        });

        const stdSignMsg = StdSignMsg.fromData(stdSignMsgData);

        const lcd = new LCDClient({
          chainID: connectedWallet.network.chainID,
          URL: connectedWallet.network.lcd,
        });

        return lcd.tx.broadcastSync(
          new StdTx(stdSignMsg.msgs, stdSignMsg.fee, [sig], stdSignMsg.memo),
        );
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
      {connectedWallet?.availableSign && !signResult && !txError && (
        <button onClick={() => send()}>Send 1USD to {toAddress}</button>
      )}
      {signResult && (
        <>
          <pre>{JSON.stringify(signResult, null, 2)}</pre>
          {txResult && <pre>{JSON.stringify(txResult, null, 2)}</pre>}
          {connectedWallet && txResult && (
            <a
              href={`https://finder.terra.money/${connectedWallet.network.chainID}/tx/${txResult.txhash}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Tx Result in Terra Finder
            </a>
          )}
          <button onClick={() => setSignResult(null)}>Clear Result</button>
        </>
      )}
      {txError && (
        <>
          <pre>{txError}</pre>
          <button onClick={() => setTxError(null)}>Clear Error</button>
        </>
      )}
      {!connectedWallet && <p>Wallet not connected!</p>}
      {connectedWallet && !connectedWallet.availableSign && (
        <p>Can not sign Tx</p>
      )}
    </div>
  );
}

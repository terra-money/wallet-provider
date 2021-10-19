import {
  CreateTxFailed,
  SignBytesResult,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider';
import React, { useCallback, useState } from 'react';

export function SignBytesSample() {
  const [signBytesResult, setSignBytesResult] =
    useState<SignBytesResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const connectedWallet = useConnectedWallet();

  const send = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    setSignBytesResult(null);

    connectedWallet
      .signBytes(Buffer.from(new Uint8Array([1, 2, 3, 4])))
      .then((nextSignBytesResult: SignBytesResult) => {
        console.log('SignBytesSample.tsx..()', nextSignBytesResult);

        setSignBytesResult(nextSignBytesResult);
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
      <h1>Sign Bytes Sample</h1>
      {connectedWallet?.availableSign && !signBytesResult && !txError && (
        <button onClick={() => send()}>
          Sign bytes <code>Buffer.from(new Uint8Array([1, 2, 3, 4]))</code>
        </button>
      )}
      {signBytesResult && (
        <>
          <pre>{JSON.stringify(signBytesResult, null, 2)}</pre>
          <button onClick={() => setSignBytesResult(null)}>Clear Result</button>
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

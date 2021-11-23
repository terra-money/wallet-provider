import {
  SignBytesFailed,
  SignBytesResult,
  Timeout,
  useConnectedWallet,
  UserDenied,
  verifyBytes,
} from '@terra-money/wallet-provider';
import React, { useCallback, useState } from 'react';

const TEST_BYTES = Buffer.from('hello world');

export default function SignBytesSample() {
  const [txResult, setTxResult] = useState<SignBytesResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const connectedWallet = useConnectedWallet();

  const send = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    setTxResult(null);
    setTxError(null);
    setVerifyResult(null);

    connectedWallet
      .signBytes(TEST_BYTES)
      .then((nextSignBytesResult: SignBytesResult) => {
        setTxResult(nextSignBytesResult);
        setTxError(null);

        const result = verifyBytes(TEST_BYTES, nextSignBytesResult.result);
        setVerifyResult(result ? 'Verify OK' : 'Verify failed');
      })
      .catch((error) => {
        setTxResult(null);
        setVerifyResult(null);

        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof SignBytesFailed) {
          setTxError('Sign Bytes Failed');
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

      {connectedWallet?.availableSignBytes &&
        !txResult &&
        !txError &&
        !verifyResult && (
          <button onClick={() => send()}>
            Sign bytes with {connectedWallet.walletAddress}
          </button>
        )}

      {txResult && <pre>{JSON.stringify(txResult, null, 2)}</pre>}

      {txError && <pre>{txError}</pre>}

      {verifyResult && <pre>{verifyResult}</pre>}

      {(!!txResult || !!txError || !!verifyResult) && (
        <button
          onClick={() => {
            setTxResult(null);
            setTxError(null);
            setVerifyResult(null);
          }}
        >
          Clear result
        </button>
      )}

      {!connectedWallet && <p>Wallet not connected!</p>}

      {connectedWallet && !connectedWallet.availableSignBytes && (
        <p>This connection does not support signBytes()</p>
      )}
    </div>
  );
}

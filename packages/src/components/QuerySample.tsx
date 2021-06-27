import { LCDClient } from '@terra-money/terra.js';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import React, { useEffect, useMemo, useState } from 'react';

export function QuerySample() {
  const connectedWallet = useConnectedWallet();

  const [bank, setBank] = useState<null | string>();

  const lcd = useMemo(() => {
    if (!connectedWallet) {
      return null;
    }

    return new LCDClient({
      URL: connectedWallet.network.lcd,
      chainID: connectedWallet.network.chainID,
    });
  }, [connectedWallet]);

  useEffect(() => {
    if (connectedWallet && lcd) {
      lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
        setBank(coins.toString());
      });
    } else {
      setBank(null);
    }
  }, [connectedWallet, lcd]);

  return (
    <div>
      <h1>Query Sample</h1>
      {bank && <pre>{bank}</pre>}
      {!connectedWallet && <p>Wallet not connected!</p>}
    </div>
  );
}

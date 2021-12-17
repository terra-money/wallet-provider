import { useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider';
import React, { useEffect, useState } from 'react';

export function QuerySample() {
  const lcd = useLCDClient();
  const connectedWallet = useConnectedWallet();

  const [bank, setBank] = useState<null | string>();

  useEffect(() => {
    if (connectedWallet) {
      // FIXME (terra.js 2.x → terra.js 3.x) the return data of LCDClient.bank.balance() is changed
      //lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
      lcd.bank.balance(connectedWallet.walletAddress).then(([coins]) => {
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

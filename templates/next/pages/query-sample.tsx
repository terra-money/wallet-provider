import { useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider';
import React, { useEffect, useState } from 'react';

export default function QuerySample() {
  const lcd = useLCDClient();
  const connectedWallet = useConnectedWallet();

  const [bank, setBank] = useState<null | string>();

  useEffect(() => {
    if (connectedWallet) {
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

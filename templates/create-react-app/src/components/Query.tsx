import {
  useConnectedWallet,
  useLCDClient,
} from '@terra-money/wallet-provider';
import React, { useEffect, useState } from 'react';

export default function Query() {
  const lcd = useLCDClient(); // LCD stands for Light Client Daemon
  const connectedWallet = useConnectedWallet();
  const [balance, setBalance] = useState<null | string>(null);
  const chainID = 'phoenix-1'; // or any other mainnet or testnet chainID supported by station (e.g. osmosis-1)

  useEffect(() => {
    if (connectedWallet) {
      lcd.bank
        .balance(connectedWallet.addresses[chainID])
        .then(([coins]) => {
          setBalance(coins.toString());
        });
    } else {
      setBalance(null);
    }
  }, [connectedWallet, lcd]); // useEffect is called when these variables change

  return (
    <div>
      {balance && <p>{balance}</p>}
      {!connectedWallet && <p>Wallet not connected!</p>}
    </div>
  );
}
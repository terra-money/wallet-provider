import { NetworkInfo, WalletProvider } from '@terra-money/wallet-provider';
import { ConnectSample } from 'components/ConnectSample';
import { QuerySample } from 'components/QuerySample';
import { TxSample } from 'components/TxSample';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const mainnet = {
  name: 'mainnet',
  chainID: 'columbus-4',
  lcd: 'https://lcd.terra.dev',
};

const testnet = {
  name: 'testnet',
  chainID: 'tequila-0004',
  lcd: 'https://tequila-lcd.terra.dev',
};

const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
};

function App() {
  return (
    <main
      style={{ margin: 20, display: 'flex', flexDirection: 'column', gap: 40 }}
    >
      <ConnectSample />
      <QuerySample />
      <TxSample />
    </main>
  );
}

ReactDOM.render(
  <WalletProvider
    defaultNetwork={mainnet}
    walletConnectChainIds={walletConnectChainIds}
  >
    <App />
  </WalletProvider>,
  document.getElementById('root'),
);

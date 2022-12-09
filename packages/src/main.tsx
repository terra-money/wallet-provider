import { getChainOptions, WalletProvider } from '@terra-money/wallet-provider';
import { ConnectSample } from 'components/ConnectSample';
import { QuerySample } from 'components/QuerySample';
import { SignBytesSample } from 'components/SignBytesSample';
import { SignSample } from 'components/SignSample';
import { PostSample } from 'components/PostSample';
import { TxSample } from 'components/TxSample';
import React from 'react';
import ReactDOM from 'react-dom';

function App({ chainOptions }: any) {
  return (
    <WalletProvider {...chainOptions}>
      <main
        style={{
          margin: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <ConnectSample />
        <QuerySample />
        <PostSample />
        <TxSample />
        <SignSample />
        <SignBytesSample />
      </main>
    </WalletProvider>
  );
}

getChainOptions().then((chainOptions) => {
  ReactDOM.render(
    <App chainOptions={chainOptions} />,
    document.getElementById('root'),
  );
});

import {
  getChainOptions,
  StaticWalletProvider,
  WalletControllerChainOptions,
  WalletProvider,
} from '@terra-money/wallet-provider';
import { AppProps } from 'next/app';
import Link from 'next/link';
import React from 'react';

export default function App({
  Component,
  defaultNetwork,
  walletConnectChainIds,
}: AppProps & WalletControllerChainOptions) {
  const main = (
    <main>
      <header style={{ display: 'flex', gap: '1em' }}>
        <Link href="/">Main</Link>
        <Link href="/connect-sample">Connect Sample</Link>
        <Link href="/query-sample">Query Sample</Link>
        <Link href="/tx-sample">Tx Sample</Link>
        <Link href="/sign-sample">Sign Sample</Link>
        <Link href="/sign-bytes-sample">Sign Bytes Sample</Link>
        <Link href="/cw20-tokens-sample">CW20 Tokens Sample</Link>
        <Link href="/network-sample">Network Sample</Link>
      </header>

      <Component />
    </main>
  );

  return typeof window !== 'undefined' ? (
    <WalletProvider
      defaultNetwork={defaultNetwork}
      walletConnectChainIds={walletConnectChainIds}
    >
      {main}
    </WalletProvider>
  ) : (
    <StaticWalletProvider defaultNetwork={defaultNetwork}>
      {main}
    </StaticWalletProvider>
  );
}

App.getInitialProps = async () => {
  const chainOptions = await getChainOptions();
  return {
    ...chainOptions,
  };
};

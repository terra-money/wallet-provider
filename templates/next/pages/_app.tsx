import {
  NetworkInfo,
  StaticWalletProvider,
  WalletProvider,
} from '@terra-money/wallet-provider';
import { AppProps } from 'next/app';
import Link from 'next/link';
import React from 'react';

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

export default function App({ Component }: AppProps) {
  const main = (
    <main>
      <header style={{display: 'flex', gap: '1em'}}>
        <Link href="/">Main</Link>
        <Link href="/connect-sample">Connect Sample</Link>
        <Link href="/query-sample">Query Sample</Link>
        <Link href="/tx-sample">Tx Sample</Link>
      </header>

      <Component />
    </main>
  );

  return typeof window !== 'undefined' ? (
    <WalletProvider
      defaultNetwork={mainnet}
      walletConnectChainIds={walletConnectChainIds}
    >
      {main}
    </WalletProvider>
  ) : (
    <StaticWalletProvider defaultNetwork={mainnet}>{main}</StaticWalletProvider>
  );
}

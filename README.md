# Terra Wallet Provider

Library to make React dApps easier using Terra Station Extension or Terra Station Mobile.

# Quick Start

Use templates to get your projects started quickly

```sh
npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/create-react-app your-app-name
cd your-app-name
yarn install
yarn start
```

[Wallet Provider + Create-React-App Template](templates/create-react-app)

# Basic Usage

If you have used `react-router-dom`'s `<BrowserRouter>`, `<useLocation()>`, you can easily understand it.

```jsx
import {
  NetworkInfo,
  WalletProvider,
  WalletStatus,
} from '@terra-money/wallet-provider';
import React from 'react';
import ReactDOM from 'react-dom';

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

ReactDOM.render(
  <WalletProvider
    defaultNetwork={mainnet}
    walletConnectChainIds={walletConnectChainIds}
  >
    <YOUR_APP />
  </WalletProvider>,
  document.getElementById('root'),
);
```

First, you need to provider the `<WalletProvider>` at the top of your React App.

```jsx
import { useWallet } from '@terra-money/wallet-provider';
import React from 'react';

function Component() {
  const { status, network, wallets } = useWallet();

  return (
    <div>
      <section>
        <pre>
          {JSON.stringify(
            {
              status,
              network,
              wallets,
            },
            null,
            2,
          )}
        </pre>
      </section>
    </div>
  );
}
```

Afterwards, you can use React Hooks such as `useWallet()` and `useConnectedWallet()` anywhere in your app.

# API

<details>

<summary><code>&lt;WalletProvider&gt;</code></summary>

```jsx
import { ReadonlyWalletSession } from '@terra-dev/readonly-wallet';
import { WalletProvider, NetworkInfo } from '@terra-money/wallet-provider';

// network information
const mainnet: NetworkInfo = {
  name: 'mainnet',
  chainID: 'columbus-4',
  lcd: 'https://lcd.terra.dev',
};

const testnet: NetworkInfo = {
  name: 'testnet',
  chainID: 'tequila-0004',
  lcd: 'https://tequila-lcd.terra.dev',
};

// WalletConnect separates chainId by number.
// Currently TerraStation Mobile uses 0 as Testnet, 1 as Mainnet.
const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
};

// Optional
// If you need to modify the modal, such as changing the design, you can put it in,
// and if you don't put the value in, there is a default modal.
async function createReadonlyWalletSession(): Promise<ReadonlyWalletSession> {
  const terraAddress = prompt('YOUR TERRA ADDRESS');
  return {
    network: mainnet,
    terraAddress,
  };
}

// Optional
// WalletConnect Client option.
const connectorOpts: IWalletConnectOptions | undefined = undefined;
const pushServerOpts: IPushServerOptions | undefined = undefined;

// Optional
// Time to wait for the Chrome Extension window.isTerraExtensionAvailable.
// If not entered, wait for default 1000 * 3 miliseconds.
// If you reduce excessively, Session recovery of Chrome Extension may fail.
const waitingChromeExtensionInstallCheck: number | undefined = undefined;

ReactDOM.render(
  <WalletProvider
    defaultNetwork={mainnet}
    walletConnectChainIds={walletConnectChainIds}
    createReadonlyWalletSession={createReadonlyWalletSession}
    connectorOpts={connectorOpts}
    pushServerOpts={pushServerOpts}
    waitingChromeExtensionInstallCheck={waitingChromeExtensionInstallCheck}
  >
    <YOUR_APP />
  </WalletProvider>,
  document.getElementById('root'),
);
```

</details>

<details>

<summary><code>&lt;useWallet()&gt;</code></summary>

This is a React Hook that can receive all the information. (Other hooks are functions for the convenience of Wrapping
this `useWallet()`)

```jsx
import { useWallet } from '@terra-money/wallet-provider';

const {
  // Can receive the Connect Types available in the user's current Browser environment.
  //
  // It's basically [ConnectType.WALLETCONNECT, READONLY].
  //
  // If Chrome Extension is installed,
  // it will be [ConnectType.CHROME_EXTENSION, ConnectType.WALLETCONNECT, ConnectType.READONLY].
  //
  // Available when configuring a UI that determines which Connect Type to connect to.
  availableConnectTypes,

  // Can receive the Connect Types that are currently available for installation.
  //
  // If the Browser is Desktop Chrome and does not have Chrome Extension installed,
  // it becomes [ConnectType.CHROME_EXTENSION]
  //
  // Other cases
  // it becomes an Empty Array.
  availableInstallTypes,

  // Can receive the current status of the Client
  //
  // WalletStatus.INITIALIZING | WalletStatus.WALLET_NOT_CONNECTED | WalletStatus.WALLET_CONNECTED
  // A value of one of the three will come in.
  //
  // INITIALIZING = Session initialization and extension installation verification are in progress (please indicate Loading).
  // WALLET_CONNECTED = This means that there is a Wallet connected (Show the UI and Disconnect Button to view Wallet information).
  // WALLET_NOT_CONNECTED = This means there are no connected Wallets (Mark Connect Button).
  status,

  // Receive information from the currently selected network
  // Gets in the same form as { name: 'mainnet', chainID: 'columnbus-4', lcd }
  network,

  // Can receive information from linked Wallet
  //
  // [{ connectType: WALLETCONNECT, terraAddress: 'XXXXXXXXX' }]
  // It comes in the same form as.
  //
  // In subsequent updates, it is arranged to implement a structure that connects multiple wallets simultaneously.
  // No wallet connected for empty array [] at this time (status = WALLET_NOT_CONNECTED)
  // Connected if 1 data exists as shown in [{}] (status = WALLET_CONNECTED)
  wallets,

  // Connect to Wallet
  //
  // connect(ConnectType.WALLETCONNECT)
  // connect(ConnectType.CHROME_EXTENSION)
  // connect(ConnectType.READONLY)
  //
  // If called above, progress will be made according to each connection.
  //
  // Use only the ConnectType given in { availableConnectType }
  connect,

  // Install the Extension required for Wallet connection
  //
  // Currently, only ConnectType.CHROME_EXTENSION is supported.
  // When install(ConnectType.CHROME_EXTENSION) is run, the Chrome Extension Store appears.
  //
  // Use only the ConnectType given in { availableInstallType }
  install,

  // Disconnect Wallet
  disconnect,

  // Features for ChromeExtension.
  //
  // Currently, ChromeExtension does not notify you of changes to Network / Wallet through WebApp.
  // You can use it when you want to update the changed information.
  recheckStatus,

  // Used to send Tx
  //
  // It has an interface like this
  // post(CreateTxOptions): Promise<TxResult>
  //
  // CreateTxOptions is the terra.js's CreateTxOptions Type
  //
  // TxResult is the type below.
  // interface TxResult extends CreateTxOptions {
  //   result: { height: number, raw_log: string, txhash: string },
  //   success: boolean
  // }
  post,
} = useWallet();
```

</details>

<details>

<summary><code>&lt;useConnectedWallet()&gt;</code></summary>

```jsx
import { useConnectedWallet } from '@terra-money/wallet-provider'

function Component() {
  const connectedWallet = useConnectedWallet()

  const postTx = useCallback(async () => {
    if (!connectedWallet) return

    console.log('walletAddress is', connectedWallet.walletAddress)
    console.log('network is', connectedWallet.network)
    console.log('connectType is', connectedWallet.connectType)

    const result = await connectedWallet.post({...})
  }, [])

  return (
    <button disabled={!connectedWallet || !connectedWallet.availablePost} onClick={() => postTx}>
      Post Tx
    </button>
  )
}
```

</details>

# Projects for reference

- [Anchor Web App](https://github.com/Anchor-Protocol/anchor-web-app/blob/master/base/src/base/AppProviders.tsx#L154)
- [Mirror Web App](https://github.com/Mirror-Protocol/terra-web-app/blob/master/src/layouts/WalletConnectProvider.tsx#L12)

# Other documents

- [한국어 (Notion)](https://www.notion.so/terramoneyteam/terra-money-wallet-provider-0-14-0-49a62205608c4e0085e1c8f5361ccc46)

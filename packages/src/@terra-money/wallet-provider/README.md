# Terra Wallet Provider

Library to make React dApps easier using Terra Station Extension or Terra Station Mobile.

# Quick Start

Use templates to get your projects started quickly

### Code Sandbox

If you want to test features quickly, you can simply run them on CodeSandbox without having to download Templates.

- [Wallet Provider + Create-React-App](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/create-react-app)
- [Wallet Provider + Next.js](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/next)
- [Wallet Provider + Vite.js](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/vite)
- [Wallet Controller + Lit](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/lit)
- [Wallet Controller + Vue.js](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/vue)
- [Wallet Controller + Svelte](https://githubbox.com/terra-money/wallet-provider/tree/main/templates/svelte)

And if you need to start your project from local computer, use the templates below. 👇

### Create React App

```sh
npx terra-templates get wallet-provider:create-react-app your-app-name
cd your-app-name
yarn install
yarn start
```

<https://github.com/terra-money/wallet-provider/tree/main/templates/create-react-app>

### Next.js

```sh
npx terra-templates get wallet-provider:next your-app-name
cd your-app-name
yarn install
yarn run dev
```

<https://github.com/terra-money/wallet-provider/tree/main/templates/next>

### Other templates

- [Wallet Provider + Vite.js](https://github.com/terra-money/wallet-provider/tree/main/templates/vite)
- [Wallet Controller + Lit](https://github.com/terra-money/wallet-provider/tree/main/templates/lit)
- [Wallet Controller + Vue.js](https://github.com/terra-money/wallet-provider/tree/main/templates/vue)
- [Wallet Controller + Svelte](https://github.com/terra-money/wallet-provider/tree/main/templates/svelte)

### Community templates (experimental)

You can find more templates in <https://templates.terra.money>. (This is the beginning stage, so it may not be enough yet)

If you make a different type of template, you can register [here](https://github.com/terra-money/templates).

# Basic Usage

First, please add `<meta name="terra-wallet" />` on your html page.

Since then, browser extensions (e.g. Terra Station chrome extension) will not attempt to connect in a Web app where this `<meta name="terra-wallet">` tag is not found.

```html
<html lang="en">
  <head>
    <meta name="terra-wallet" />
  </head>
</html>
```

If you have used `react-router-dom`'s `<BrowserRouter>`, `useLocation()`, you can easily understand it.

```jsx
import {
  NetworkInfo,
  WalletProvider,
  WalletStatus,
  getChainOptions,
} from '@terra-money/wallet-provider';
import React from 'react';
import ReactDOM from 'react-dom';

// getChainOptions(): Promise<{ defaultNetwork, walletConnectChainIds }>
getChainOptions().then((chainOptions) => {
  ReactDOM.render(
    <WalletProvider {...chainOptions}>
      <YOUR_APP />
    </WalletProvider>,
    document.getElementById('root'),
  );
});
```

First, you need to wrap your React App with the `<WalletProvider>` component.

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

Afterwards, you can use React Hooks such as `useWallet()`, `useConnectedWallet()` and `useLCDClient()` anywhere in your app.

# API

<details>

<summary><code>&lt;WalletProvider&gt;</code></summary>

```jsx
import {
  WalletProvider,
  NetworkInfo,
  ReadonlyWalletSession,
} from '@terra-money/wallet-provider';

// network information
const mainnet: NetworkInfo = {
  name: 'mainnet',
  chainID: 'columbus-5',
  lcd: 'https://lcd.terra.dev',
};

const testnet: NetworkInfo = {
  name: 'testnet',
  chainID: 'bombay-12',
  lcd: 'https://bombay-lcd.terra.dev',
};

// WalletConnect separates chainId by number.
// Currently TerraStation Mobile uses 0 as Testnet, 1 as Mainnet.
const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
};

// ⚠️ If there is no special reason, use `getChainOptions()` instead of `walletConnectChainIds` above.

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

<summary><code>useWallet()</code></summary>

This is a React Hook that can receive all the information. (Other hooks are functions for the convenience of Wrapping
this `useWallet()`)

<!-- source packages/src/@terra-money/use-wallet/useWallet.ts --pick "Wallet" -->

[packages/src/@terra-money/use-wallet/useWallet.ts](packages/src/@terra-money/use-wallet/useWallet.ts)

````ts
export interface Wallet {
  /**
   * current client status
   *
   * this will be one of WalletStatus.INITIALIZING | WalletStatus.WALLET_NOT_CONNECTED | WalletStatus.WALLET_CONNECTED
   *
   * INITIALIZING = checking that the session and the chrome extension installation. (show the loading to users)
   * WALLET_NOT_CONNECTED = there is no connected wallet (show the connect and install options to users)
   * WALLET_CONNECTED = there is aconnected wallet (show the wallet info and disconnect button to users)
   *
   * @see Wallet#refetchStates
   * @see WalletController#status
   */
  status: WalletStatus;
  /**
   * current selected network
   *
   * - if status is INITIALIZING or WALLET_NOT_CONNECTED = this will be the defaultNetwork
   * - if status is WALLET_CONNECTED = this depends on the connected environment
   *
   * @see WalletProviderProps#defaultNetwork
   * @see WalletController#network
   */
  network: NetworkInfo;
  /**
   * available connect types on the browser
   *
   * @see Wallet#connect
   * @see WalletController#availableConnectTypes
   */
  availableConnectTypes: ConnectType[];
  /**
   * available connections includes identifier, name, icon
   *
   * @example
   * ```
   * const { availableConnections, connect } = useWallet()
   *
   * return (
   *  <div>
   *    {
   *      availableConnections.map(({type, identifier, name, icon}) => (
   *        <butotn key={`${type}:${identifier}`} onClick={() => connect(type, identifier)}>
   *          <img src={icon} /> {name}
   *        </button>
   *      ))
   *    }
   *  </div>
   * )
   * ```
   */
  availableConnections: Connection[];
  /**
   * current connected connection
   */
  connection: Connection | undefined;
  /**
   * connect to wallet
   *
   * @example
   * ```
   * const { status, availableConnectTypes, connect } = useWallet()
   *
   * return status === WalletStatus.WALLET_NOT_CONNECTED &&
   *        availableConnectTypes.includs(ConnectType.EXTENSION) &&
   *  <button onClick={() => connect(ConnectType.EXTENSION)}>
   *    Connct Chrome Extension
   *  </button>
   * ```
   *
   * @see Wallet#availableConnectTypes
   * @see WalletController#connect
   */
  connect: (type?: ConnectType, identifier?: string) => void;
  /**
   * manual connect to read only session
   *
   * @see Wallet#connectReadonly
   */
  connectReadonly: (terraAddress: string, network: NetworkInfo) => void;
  /**
   * available install types on the browser
   *
   * in this time, this only contains [ConnectType.EXTENSION]
   *
   * @see Wallet#install
   * @see WalletController#availableInstallTypes
   */
  availableInstallTypes: ConnectType[];
  /**
   * available installations includes identifier, name, icon, url
   *
   * @example
   * ```
   * const { availableInstallations } = useWallet()
   *
   * return (
   *  <div>
   *    {
   *      availableInstallations.map(({type, identifier, name, icon, url}) => (
   *        <a key={`${type}:${identifier}`} href={url}>
   *          <img src={icon} /> {name}
   *        </a>
   *      ))
   *    }
   *  </div>
   * )
   * ```
   *
   * @see Wallet#install
   * @see WalletController#availableInstallations
   */
  availableInstallations: Installation[];
  /**
   * @deprecated Please use availableInstallations
   *
   * install for the connect type
   *
   * @example
   * ```
   * const { status, availableInstallTypes } = useWallet()
   *
   * return status === WalletStatus.WALLET_NOT_CONNECTED &&
   *        availableInstallTypes.includes(ConnectType.EXTENSION) &&
   *  <button onClick={() => install(ConnectType.EXTENSION)}>
   *    Install Extension
   *  </button>
   * ```
   *
   * @see Wallet#availableInstallTypes
   * @see WalletController#install
   */
  install: (type: ConnectType) => void;
  /**
   * connected wallets
   *
   * this will be like
   * `[{ connectType: ConnectType.WALLETCONNECT, terraAddress: 'XXXXXXXXX' }]`
   *
   * in this time, you can get only one wallet. `wallets[0]`
   *
   * @see WalletController#wallets
   */
  wallets: WalletInfo[];
  /**
   * disconnect
   *
   * @example
   * ```
   * const { status, disconnect } = useWallet()
   *
   * return status === WalletStatus.WALLET_CONNECTED &&
   *  <button onClick={() => disconnect()}>
   *    Disconnect
   *  </button>
   * ```
   */
  disconnect: () => void;
  /**
   * reload the connected wallet states
   *
   * in this time, this only work on the ConnectType.EXTENSION
   *
   * @see WalletController#refetchStates
   */
  refetchStates: () => void;
  /**
   * @deprecated please use refetchStates(). this function will remove on next major update
   */
  recheckStatus: () => void;
  /**
   * support features of this connection
   *
   * @example
   * ```
   * const { supportFeatures } = useWallet()
   *
   * return (
   *  <div>
   *    {
   *      supportFeatures.has('post') &&
   *      <button onClick={post}>post</button>
   *    }
   *    {
   *      supportFeatures.has('cw20-token') &&
   *      <button onClick={addCW20Token}>add cw20 token</button>
   *    }
   *  </div>
   * )
   * ```
   *
   * This type is same as `import type { TerraWebExtensionFeatures } from '@terra-money/web-extension-interface'`
   */
  supportFeatures: Set<
    'post' | 'sign' | 'sign-bytes' | 'cw20-token' | 'network'
  >;
  /**
   * post transaction
   *
   * @example
   * ```
   * const { post } = useWallet()
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: TxResult = await post({...CreateTxOptions})
   *    // DO SOMETHING...
   *   } catch (error) {
   *     if (error instanceof UserDenied) {
   *       // DO SOMETHING...
   *     } else {
   *       // DO SOMETHING...
   *     }
   *   }
   * }, [])
   * ```
   *
   * @param { CreateTxOptions } tx transaction data
   * @param terraAddress - does not work at this time. for the future extension
   *
   * @return { Promise<TxResult> }
   *
   * @throws { UserDenied } user denied the tx
   * @throws { CreateTxFailed } did not create txhash (error dose not broadcasted)
   * @throws { TxFailed } created txhash (error broadcated)
   * @throws { Timeout } user does not act anything in specific time
   * @throws { TxUnspecifiedError } unknown error
   *
   * @see WalletController#post
   */
  post: (tx: CreateTxOptions, terraAddress?: string) => Promise<TxResult>;
  /**
   * sign transaction
   *
   * @example
   * ```
   * const { sign } = useWallet()
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: SignResult = await sign({...CreateTxOptions})
   *
   *    // Broadcast SignResult
   *    const tx = result.result
   *
   *    const lcd = new LCDClient({
   *      chainID: connectedWallet.network.chainID,
   *      URL: connectedWallet.network.lcd,
   *    })
   *
   *    const txResult = await lcd.tx.broadcastSync(tx)
   *
   *    // DO SOMETHING...
   *   } catch (error) {
   *     if (error instanceof UserDenied) {
   *       // DO SOMETHING...
   *     } else {
   *       // DO SOMETHING...
   *     }
   *   }
   * }, [])
   * ```
   *
   * @param { CreateTxOptions } tx transaction data
   * @param terraAddress - does not work at this time. for the future extension
   *
   * @return { Promise<SignResult> }
   *
   * @throws { UserDenied } user denied the tx
   * @throws { CreateTxFailed } did not create txhash (error dose not broadcasted)
   * @throws { TxFailed } created txhash (error broadcated)
   * @throws { Timeout } user does not act anything in specific time
   * @throws { TxUnspecifiedError } unknown error
   *
   * @see WalletController#sign
   */
  sign: (tx: CreateTxOptions, terraAddress?: string) => Promise<SignResult>;
  /**
   * sign any bytes
   *
   * @example
   * ```
   * const { signBytes } = useWallet()
   *
   * const BYTES = Buffer.from('hello world')
   *
   * const callback = useCallback(async () => {
   *   try {
   *     const { result }: SignBytesResult = await signBytes(BYTES)
   *
   *     console.log(result.recid)
   *     console.log(result.signature)
   *     console.log(result.public_key)
   *
   *     const verified: boolean = verifyBytes(BYTES, result)
   *   } catch (error) {
   *     if (error instanceof UserDenied) {
   *       // DO SOMETHING...
   *     } else {
   *       // DO SOMETHING...
   *     }
   *   }
   * }, [])
   * ```
   *
   * @param bytes
   */
  signBytes: (bytes: Buffer, terraAddress?: string) => Promise<SignBytesResult>;
  /**
   * check if tokens are added on the extension
   *
   * @param chainID
   * @param tokenAddrs cw20 token addresses
   *
   * @return token exists
   *
   * @see WalletController#hasCW20Tokens
   */
  hasCW20Tokens: (
    chainID: string,
    ...tokenAddrs: string[]
  ) => Promise<{
    [tokenAddr: string]: boolean;
  }>;
  /**
   * request add token addresses to browser extension
   *
   * @param chainID
   * @param tokenAddrs cw20 token addresses
   *
   * @return token exists
   *
   * @see WalletController#addCW20Tokens
   */
  addCW20Tokens: (
    chainID: string,
    ...tokenAddrs: string[]
  ) => Promise<{
    [tokenAddr: string]: boolean;
  }>;
  /**
   * check if network is added on the extension
   *
   * @param network
   *
   * @return network exists
   *
   * @see WalletController#hasNetwork
   */
  hasNetwork: (network: Omit<NetworkInfo, 'name'>) => Promise<boolean>;
  /**
   * request add network to browser extension
   *
   * @param network
   *
   * @return network exists
   *
   * @see WalletController#addNetwork
   */
  addNetwork: (network: NetworkInfo) => Promise<boolean>;
  /**
   * Some mobile wallet emulates the behavior of chrome extension.
   * It confirms that the current connection environment is such a wallet.
   * (If you are running connect() by checking availableConnectType, you do not need to use this API.)
   *
   * @see WalletController#isChromeExtensionCompatibleBrowser
   */
  isChromeExtensionCompatibleBrowser: () => boolean;
}
````

<!-- /source -->

</details>

<details>

<summary><code>useConnectedWallet()</code></summary>

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

<details>

<summary><code>useLCDClient()</code></summary>

```jsx
import { useLCDClient } from '@terra-money/wallet-provider';

function Component() {
  const lcd = useLCDClient();

  const [result, setResult] = useState('');

  useEffect(() => {
    lcd.treasury.taxRate().then((taxRate) => {
      setResult(taxRate.toString());
    });
  }, []);

  return <div>Result: {result}</div>;
}
```

</details>

# Projects for reference

- [Anchor Web App](https://github.com/Anchor-Protocol/anchor-web-app/blob/master/base/src/base/AppProviders.tsx#L154)
- [Mirror Web App](https://github.com/Mirror-Protocol/terra-web-app/blob/master/src/layouts/WalletConnectProvider.tsx#L12)

# Links

- [Releases (Changelog)](https://github.com/terra-money/wallet-provider/releases)

# Trouble-shooting guide

wallet-provider contains the original source codes in sourcemaps.

<img src="https://raw.githubusercontent.com/terra-money/wallet-provider/main/readme-assets/trouble-shooting-guide.png" width="700" style="max-width: 100%" alt="Trouble-Shooting Guide" />

You can check `src/@terra-money/wallet-provider/` in the Chrome Devtools / Sources Tab, and you can also use breakpoints
here for debug.

(It may not be visible depending on your development settings such as Webpack.)

# For Chrome Extension compatible wallet developers

<details>

<summary><code>Chrome Extension compatible wallet development guide</code></summary>

### 1. Create dApp for test

There is the `dangerously__chromeExtensionCompatibleBrowserCheck` option to allow you to create a test environment for
wallet development.

By declaring the `dangerously__chromeExtensionCompatibleBrowserCheck`, you can make your wallet recognized as the chrome
extension.

```jsx
<WalletProvider
  dangerously__chromeExtensionCompatibleBrowserCheck={(userAgent) =>
    /YourWallet/.test(userAgent)
  }
>
  ...
</WalletProvider>
```

### 2. Register your wallet as default allow

If your wallet has been developed,

Please send me your wallet App link (Testlight version is OK)

And send me Pull Request by modifying `DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK` in
the `packages/src/@terra-money/wallet-provider/env.ts` file. (or just make an issue is OK)

```diff
export const DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK = (userAgent: string) => {
-  return /MathWallet\//.test(userAgent);
+  return /MathWallet\//.test(userAgent) || /YourWallet/.test(userAgent);
}
```

</details>

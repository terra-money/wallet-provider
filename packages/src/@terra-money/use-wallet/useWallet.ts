import {
  Connection,
  ConnectType,
  Installation,
  NetworkInfo,
  SignBytesResult,
  SignResult,
  TxResult,
  WalletInfo,
  WalletStatus,
} from '@terra-money/wallet-types';
import { CreateTxOptions } from '@terra-money/terra.js';
import { Context, createContext, useContext } from 'react';

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
  ) => Promise<{ [tokenAddr: string]: boolean }>;

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
  ) => Promise<{ [tokenAddr: string]: boolean }>;

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

// @ts-ignore
export const WalletContext: Context<Wallet> = createContext<Wallet>();

export function useWallet(): Wallet {
  return useContext(WalletContext);
}

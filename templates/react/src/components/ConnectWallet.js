import { useWallet, WalletStatus } from '@terra-dev/use-wallet'

export const ConnectWallet = () => {
  const {
    status,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet()

  return (
    <div>
      {status === WalletStatus.WALLET_NOT_CONNECTED && (
        <>
          {availableInstallTypes.map((connectType) => (
            <button
              key={`install-${connectType}`}
              onClick={() => install(connectType)}
              type="button"
            >
              Install {connectType}
            </button>
          ))}
          {availableConnectTypes.map((connectType) => (
            <button
              key={`connect-${connectType}`}
              onClick={() => connect(connectType)}
              type="button"
            >
              Connect {connectType}
            </button>
          ))}
        </>
      )}
      {status === WalletStatus.WALLET_CONNECTED && (
        <button onClick={() => disconnect()} type="button">
          Disconnect
        </button>
      )}
    </div>
  )
}

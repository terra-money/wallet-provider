import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import React, { useEffect } from 'react';

export function ConnectSample() {
  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet();

  // TODO remove test codes
  useEffect(() => {
    console.log('ConnectSample.tsx..ConnectSample()', status, network, wallets);
  }, [network, status, wallets]);

  return (
    <div>
      <h1>Connect Sample</h1>
      <section>
        <pre>
          {JSON.stringify(
            {
              status,
              network,
              wallets,
              availableConnectTypes,
              availableInstallTypes,
            },
            null,
            2,
          )}
        </pre>
      </section>

      <footer>
        {status === WalletStatus.WALLET_NOT_CONNECTED && (
          <>
            {availableInstallTypes.map((connectType) => (
              <button
                key={'install-' + connectType}
                onClick={() => install(connectType)}
              >
                Install {connectType}
              </button>
            ))}
            {availableConnectTypes.map((connectType) => (
              <button
                key={'connect-' + connectType}
                onClick={() => connect(connectType)}
              >
                Connect {connectType}
              </button>
            ))}
          </>
        )}
        {status === WalletStatus.WALLET_CONNECTED && (
          <button onClick={() => disconnect()}>Disconnect</button>
        )}
      </footer>
    </div>
  );
}

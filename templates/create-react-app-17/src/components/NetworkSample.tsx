import { useWallet, WalletStatus } from '@terra-money/use-wallet';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function NetworkSample() {
  const { status, supportFeatures } = useWallet();

  return (
    <div>
      <h1>Network Sample</h1>
      {supportFeatures.has('network') ? (
        <Component />
      ) : status === WalletStatus.WALLET_CONNECTED ? (
        <p>This connection does not support Network commands</p>
      ) : (
        <p>Wallet not connected!</p>
      )}
    </div>
  );
}

const TEST_NETWORK = { 
  "ares-1": {
    "chainID": "ares-1",
    "lcd": "https://testnet-rest.marsprotocol.io",
    "gasAdjustment": 2,
    "gasPrices": { "umars": 0 },
    "prefix": "mars",
    "coinType": "330",
    "baseAsset": "umars",
    "name": "Mars",
    "icon": "https://station-assets.terra.money/img/chains/Mars.svg",
    "ibc": {
      "toTerra": "channel-0",
      "fromTerra": "channel-189"
    },
  }
}
function Component() {
  const { hasNetwork, addNetwork } = useWallet();

  const [networkExists, setNetworkExists] = useState<
    'exists' | 'not exists' | null
  >(null);

  const availableAdd = useMemo(() => {
    return networkExists === 'not exists';
  }, [networkExists]);

  useEffect(() => {
    hasNetwork(TEST_NETWORK).then((result) =>
      setNetworkExists(result ? 'exists' : 'not exists'),
    );
  }, [hasNetwork]);

  const add = useCallback(() => {
    addNetwork(TEST_NETWORK).then((result) =>
      setNetworkExists(result ? 'exists' : 'not exists'),
    );
  }, [addNetwork]);

  return (
    <div>
      <pre>Network exists: {networkExists}</pre>
      {availableAdd && <button onClick={add}>Add network</button>}
    </div>
  );
}

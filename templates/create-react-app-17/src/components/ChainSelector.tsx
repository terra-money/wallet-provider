import { useState, createContext, useContext, useMemo } from "react";
import { useWallet } from "@terra-money/wallet-provider";
const SelectedChainContext = createContext('pisco-1');

export const useSelectedChain = () => useContext(SelectedChainContext);

export const ChainSelector = ({ children }: {children: React.ReactNode;}) => {
  const { network } = useWallet();

  const terraNetwork = useMemo(() => {
    return Object.values(network).find((c) => c.prefix === 'terra')?.chainID || 'pisco-1' ;
  }, [network]);
  console.log('terraNetwork', terraNetwork)

  const [chainID, setChainID] = useState<string>(terraNetwork);

  return (
    <SelectedChainContext.Provider value={chainID}>
    <div style={{display: 'flex'}}>
      {Object.values(network).map((c) => (
        <button key={c.chainID} onClick={() => setChainID(c.chainID)}>
          {c.prefix}
        </button>
      ))}
      </div>
      <>{children}</>
    </SelectedChainContext.Provider>
  );
};

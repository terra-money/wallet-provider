import { useState, createContext, useContext } from "react";
import { useWallet } from "@terra-money/wallet-provider";

const ChainFilterContext = createContext<{chainID: string}>({ chainID: 'pisco-1' });
export const useChainFilter = () => useContext(ChainFilterContext);
export const ChainFilter = ({ children }: {children: React.ReactNode;}) => {
  const { network } = useWallet();
  const [chainID, setChainID] = useState<string>('pisco-1');

  return (
    <ChainFilterContext.Provider value={{ chainID }}>
    <div style={{ display: 'flex' }}>
      {Object.values(network).map((c) => (
        <button key={c.chainID} onClick={() => setChainID(c.chainID)}>
          {c.prefix}
        </button>
      ))}
      </div>
      <>{children}</>
    </ChainFilterContext.Provider>
  );
};

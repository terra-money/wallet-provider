import styled from "styled-components";
import { useState, createContext, useContext, useEffect } from "react";
import { useWallet } from "@terra-money/wallet-provider";

const ButtonContainer = styled.div`
  display: flex;
`;

const SelectedChainContext = createContext('');
export const useSelectedChain = () => useContext(SelectedChainContext);

export const ChainSelector = ({ children }: {children: React.ReactNode;}) => {
  const { network } = useWallet();
  const [chainID, setChainID] = useState('');

  useEffect(() => {
    const terraNetwork = Object.values(network).find((c) => c.prefix === 'terra')?.chainID 
    setChainID(terraNetwork || 'pisco-1');
  }, [network]);


  return (
    <SelectedChainContext.Provider value={chainID}>
    <ButtonContainer>
      {Object.values(network).map((c) => (
        <div key={c.chainID} style={{ opacity: c.chainID === chainID ? '1': '0.5'}}>
        <button onClick={() => setChainID(c.chainID)}>
          {c.prefix}
        </button>
        </div>
      ))}
      </ButtonContainer>
      <>{children}</>
    </SelectedChainContext.Provider>
  );
};

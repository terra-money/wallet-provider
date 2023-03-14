import { useState, createContext, useContext } from "react";
import { useWallet } from "@terra-money/wallet-provider";
import styled from "styled-components";

const ButtonContainer = styled.div`
  display: flex;
`;

const SelectedChainContext = createContext('pisco-1');

export const useSelectedChain = () => useContext(SelectedChainContext);

export const ChainSelector = ({ children }: {children: React.ReactNode;}) => {
  const { network } = useWallet();

  const terraNetwork = Object.values(network).find((c) => c?.prefix === 'terra');
  const [chainID, setChainID] = useState<string>(terraNetwork?.chainID || 'pisco-1');

  return (
    <SelectedChainContext.Provider value={chainID}>
    <ButtonContainer>
      {Object.values(network).map((c) => (
        <button key={c.chainID} onClick={() => setChainID(c.chainID)}>
          {c.prefix}
        </button>
      ))}
      </ButtonContainer>
      <>{children}</>
    </SelectedChainContext.Provider>
  );
};

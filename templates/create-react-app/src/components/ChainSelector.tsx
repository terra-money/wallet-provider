import styled from "styled-components";
import { useState, createContext, useContext, useEffect } from "react";
import { useWallet } from "@terra-money/wallet-provider";

const PillsContainer = styled.div`
  display: flex;
`;

interface ChainPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

const ChainPill = styled.button<ChainPillProps>`
  opacity: ${(p) => (p.active ? 1 : 0.5)};
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
      <PillsContainer>
        {Object.values(network).map((c) => (
          <ChainPill active={c.chainID === chainID}
            onClick={() => setChainID(c.chainID)}>
            {/* <img src={c.icon} alt={c.name} /> */}

            {c.prefix}
          </ChainPill>
        ))}
        </PillsContainer>
      <>{children}</>
    </SelectedChainContext.Provider>
  );
};

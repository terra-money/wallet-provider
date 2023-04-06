import styled from "styled-components";
import { useState, createContext, useContext, useEffect } from "react";
import { useWallet } from "@terra-money/wallet-provider";
import { ConnectedWalletNetworkInfo} from 'utils'
 
interface ChainPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

const PillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 1rem;
  gap: 0.5rem;
`;

const ChainPill = styled.button<ChainPillProps>`
  opacity: ${(p) => (p.active ? 1 : 0.5)};
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  min-width: 4rem;
  border-radius: 1rem;
  padding: 0.1rem 1rem;
`;

const ChainImg = styled.img`
  height: 1rem;
  `


const SelectedChainContext = createContext('');
export const useSelectedChain = () => useContext(SelectedChainContext);

export const ChainSelector = ({ children }: {children: React.ReactNode;}) => {
  const { network } = useWallet();
  const networks = Object.values(network) as ConnectedWalletNetworkInfo[];
  const [chainID, setChainID] = useState('');

  // useEffect(() => {
  //   const terraNetwork = networks.find((c) => c.prefix === 'terra')?.chainID 
  //   setChainID(terraNetwork || 'pisco-1');
  // });


  return (
    <SelectedChainContext.Provider value={chainID}>
      <PillsContainer>
        {Object.values(networks).map((c) => (
          <ChainPill active={c.chainID === chainID}
            onClick={() => setChainID(c.chainID)}>
            <ChainImg src={c.icon} alt={c.name} />
            {c.name}
          </ChainPill>
        ))}
        </PillsContainer>
      <>{children}</>
    </SelectedChainContext.Provider>
  );
};

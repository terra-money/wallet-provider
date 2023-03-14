import { useWallet, WalletStatus } from "@terra-money/use-wallet";
import React from "react";
import styled from "styled-components";
import { useSelectedChain } from "./ChainSelector";

const ButtonsHelperText = styled.h2`
  font-size: 22px;
  margin-top: 3rem;
  margin-bottom: 15px;
`;

const Button = styled.a`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  line-height: 1;
  padding: 1px 20px;
  margin: 0 5px;
  white-space: pre;
  border-radius: 16px;
  min-width: 100px;
  height: 32px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  box-shadow: inset 0 0 0 1.75px #2043b5;
  background: white;
  text-decoration: none;
  color: #2043b6;
  transition: 0.2s;

  img {
    height: 20px;
    width: 20px;
  }

  &:hover {
    box-shadow: 3px 3px 6px rgb(55 55 55 / 25%);
    background: linear-gradient(90deg, #228bbc, #002c81);
    color: white;
    cursor: pointer;
  }
`;

export function ConnectSample() {
  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    supportFeatures,
    connect,
    availableInstallations,
    disconnect,
  } = useWallet();

  const chainID = useSelectedChain();

  return (
    <div>
      <h1>Connect Sample</h1>
      <section>
        <pre>
          {JSON.stringify(
            {
              status,
              network: network[chainID],
              wallets,
              supportFeatures: Array.from(supportFeatures),
              availableConnectTypes,
              availableInstallTypes,
            },
            null,
            2
          )}
        </pre>
      </section>

      <footer>
        {status === WalletStatus.WALLET_NOT_CONNECTED && (
          <>
            <ButtonsHelperText>Available for Install</ButtonsHelperText>
            {availableInstallations.map(
              ({ icon, type, url, identifier, name }) => (
                <Button key={`${type}:${identifier}`} href={url}>
                  <img src={icon} alt={name} /> {name}
                </Button>
              )
            )}
            <ButtonsHelperText>Available Connect types</ButtonsHelperText>
            {availableConnectTypes.map((connectType) => (
              <Button
                key={"connect-" + connectType}
                onClick={() => connect(connectType)}
              >
                Connect {connectType}
              </Button>
            ))}
            <ButtonsHelperText>Available Connections</ButtonsHelperText>
            {availableConnections.map(
              ({ type, name, icon, identifier = "" }) => (
                <Button
                  key={"connection-" + type + identifier}
                  onClick={() => connect(type, identifier)}
                >
                  <img
                    src={icon}
                    alt={name}
                    style={{ width: "1em", height: "1em" }}
                  />
                  {name}
                  {identifier && <div>[{identifier}]</div>}
                </Button>
              )
            )}
          </>
        )}
        {status === WalletStatus.WALLET_CONNECTED && (
          <Button onClick={() => disconnect()}>Disconnect</Button>
        )}
      </footer>
    </div>
  );
}

import React from "react";
import styled from "styled-components";
import { ConnectSample } from "./components/ConnectSample";
import { CW20TokensSample } from "./components/CW20TokensSample";
import { NetworkSample } from "./components/NetworkSample";
import { QuerySample } from "./components/QuerySample";
import { SignBytesSample } from "./components/SignBytesSample";
import { SignSample } from "./components/SignSample";
import { TxSample } from "./components/TxSample";

const Main = styled.main`
  margin: 20;
  display: "flex";
  flex-direction: "column";
  gap: 40;
`;

function App() {
  return (
    <Main>
      <ConnectSample />
      <QuerySample />
      <TxSample />
      <SignSample />
      <SignBytesSample />
      <CW20TokensSample />
      <NetworkSample />
    </Main>
  );
}

export default App;

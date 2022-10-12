import { getChainOptions, WalletProvider } from "@terra-money/wallet-provider";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")!);

getChainOptions().then((chainOptions) => {
  root.render(
    <WalletProvider {...chainOptions}>
      <App />
    </WalletProvider>
  );
});

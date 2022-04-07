import React from 'react'
import ReactDOM from 'react-dom'

import { getChainOptions, WalletProvider } from '@terra-money/wallet-provider'

import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

getChainOptions().then((chainOptions) => {
  ReactDOM.render(
    <React.StrictMode>
      <WalletProvider {...chainOptions}>
        <App />
      </WalletProvider>
      ,
    </React.StrictMode>,
    document.getElementById('root'),
  )
})

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

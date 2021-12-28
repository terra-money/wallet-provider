// language=css
export const modalStyle = `

@keyframes wallet-wc-modal--dim-enter {
  0% {
    opacity: 0;
  }
  
  100% {
    opacity: 1;
  }
}

@keyframes wallet-wc-modal--content-enter {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.wallet-wc-modal {
  position: fixed;
  z-index: 100000;

  color: #212121;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  display: grid;
  place-content: center;
}

.wallet-wc-modal > .wallet-wc-modal--dim {
  position: fixed;
  z-index: -1;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);

  animation: wallet-wc-modal--dim-enter 0.2s ease-in-out;
}

.wallet-wc-modal > .wallet-wc-modal--content {
  border-radius: 8px;

  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);
  
  text-align: center;

  animation: wallet-wc-modal--content-enter 0.2s ease-in-out;
}

.wallet-wc-modal > .wallet-wc-modal--content h1 {
  color: #3b99fc;
  
  font-size: 20px;
  font-family: sans-serif;
  font-weight: bold;
  
  margin: 0 0 12px 0;
}

.wallet-wc-modal > .wallet-wc-modal--content p {
  color: #212121;
  
  font-size: 14px;
  font-family: sans-serif;
  
  margin: 0 0 32px 0;
}

.wallet-wc-modal > .wallet-wc-modal--content button {
  display: block;
  
  cursor: pointer;
  outline: none;
  border: 0;
  
  width: 295px;
  height: 48px;
  border-radius: 30px;
  
  font-size: 14px;
  font-weight: bold;
  
  color: #ffffff;
  background-color: #2043b5;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="desktop"] {
  padding: 40px 80px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="mobile"] {
  padding: 40px 20px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="mobile"] h1 {
  margin-bottom: 32px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="mobile"] p {
  display: none;
}
`;

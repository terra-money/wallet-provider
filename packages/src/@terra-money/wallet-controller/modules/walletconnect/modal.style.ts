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

  color: #000000;

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
  border-radius: 25px;

  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);

  animation: wallet-wc-modal--content-enter 0.2s ease-in-out;
}

.wallet-wc-modal > .wallet-wc-modal--content button {
  cursor: pointer;

  display: block;
  outline: none;
  width: 100%;
  height: 32px;
  font-size: 13px;
  letter-spacing: -0.2px;
  border-radius: 18px;
  border: 0;
  color: #ffffff;
  background-color: #2c2c2c;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="desktop"] {
  padding: 50px 60px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="desktop"] h1 {
  font-size: 27px;
  font-weight: 500;

  text-align: center;

  margin-bottom: 24px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="mobile"] {
  padding: 40px 30px;
  min-width: 320px;
}

.wallet-wc-modal > .wallet-wc-modal--content[data-device="mobile"] h1 {
  font-size: 22px;
  font-weight: 500;

  text-align: center;

  margin-bottom: 30px;
}
`;

// language=css
export const modalStyle = `

@keyframes wallet-readonly-modal--dim-enter {
  0% {
    opacity: 0;
  }
  
  100% {
    opacity: 1;
  }
}

@keyframes wallet-readonly-modal--content-enter {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.wallet-readonly-modal {
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

.wallet-readonly-modal > .wallet-readonly-modal--dim {
  position: fixed;
  z-index: -1;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);

  animation: wallet-readonly-modal--dim-enter 0.2s ease-in-out;
}

.wallet-readonly-modal > .wallet-readonly-modal--content {
  max-width: 80vw;
  width: 450px;

  border-radius: 25px;

  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);

  animation: wallet-readonly-modal--content-enter 0.2s ease-in-out;

  padding: 50px 60px;
  }

.wallet-readonly-modal > .wallet-readonly-modal--content h1 {
  font-size: 27px;
  font-weight: 500;

  text-align: center;

  margin-bottom: 24px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content label {
  position: relative;
}

.wallet-readonly-modal > .wallet-readonly-modal--content label select {
  -webkit-appearance: none;
  outline: none;
  padding: 10px 40px 10px 12px;
  width: 100%;
  border: 1px solid #2c2c2c;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content label svg {
  position: absolute;
  right: 12px;
  top: calc(50%);
  width: 10px;
  height: 6px;
  stroke-width: 2px;
  stroke: #2c2c2c;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.wallet-readonly-modal > .wallet-readonly-modal--content input {
  box-sizing: border-box;
  margin-top: 10px;

  font-size: 13px;
  outline: none;
  border-radius: 10px;
  padding: 0 12px;
  width: 100%;
  height: 37px;
  border: 1px solid #2c2c2c;
}

.wallet-readonly-modal > .wallet-readonly-modal--content button {
  margin-top: 20px;

  cursor: pointer;

  display: block;
  outline: none;
  width: 100%;
  height: 40px;
  font-size: 13px;
  letter-spacing: -0.2px;
  border-radius: 18px;
  border: 0;

  color: #ffffff;
  background-color: #2c2c2c;
}

.wallet-readonly-modal > .wallet-readonly-modal--content button:disabled {
  opacity: 0.4;
}
`;

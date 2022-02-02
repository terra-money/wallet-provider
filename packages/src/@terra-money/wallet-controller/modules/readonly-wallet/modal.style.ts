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

@keyframes wallet-readonly-modal--content-slide {
  0% {
    opacity: 0;
    transform: translateY(300px);
  }
  
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.wallet-readonly-modal {
  position: fixed;
  z-index: 100000;

  color: #212121;
  font-family: sans-serif;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  display: grid;
  place-content: center;
}

.wallet-readonly-modal select, .wallet-readonly-modal input {
  color: #212121;
  background-color: #ffffff;
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
  box-sizing: border-box;
  
  max-width: 640px;
  width: 100vw;

  border-radius: 8px;

  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);

  animation: wallet-readonly-modal--content-enter 0.2s ease-in-out;

  padding: 40px;
  
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content h1 {
  font-size: 20px;
  font-weight: bold;
  
  margin: 0 0 12px 0;

  text-align: center;
}

.wallet-readonly-modal > .wallet-readonly-modal--content label {
  display: block;

  color: #2043b5;
  font-size: 14px;
  font-weight: 600;

  margin-bottom: 8px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content .select-wrapper {
  position: relative;
}

.wallet-readonly-modal > .wallet-readonly-modal--content .select-wrapper svg {
  position: absolute;
  right: 10px;
  top: 11px;
  
  width: 20px;
  height: 20px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content .select-wrapper svg path {
  color: #212121;
}

.wallet-readonly-modal > .wallet-readonly-modal--content .select-wrapper select {
  outline: none;
  appearance: none;

  width: 100%;
  height: 45px;

  border: 1px solid #cfd8ea;
  border-radius: 8px;

  padding: 0 25px 0 15px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content .select-wrapper select:focus {
  border-color: #2043b5;
}

.wallet-readonly-modal > .wallet-readonly-modal--content input {
  box-sizing: border-box;
  outline: none;

  width: 100%;
  height: 45px;

  border: 1px solid #cfd8ea;
  border-radius: 8px;

  padding: 0 15px;
}

.wallet-readonly-modal > .wallet-readonly-modal--content input:focus {
  border-color: #2043b5;
}

.wallet-readonly-modal > .wallet-readonly-modal--content button {
  margin-top: 20px;
  
  display: block;
  
  cursor: pointer;
  outline: none;
  border: 0;
  
  width: 100%;
  height: 48px;
  border-radius: 30px;
  
  font-size: 14px;
  font-weight: bold;
  
  color: #ffffff;
  background-color: #2043b5;
}

.wallet-readonly-modal > .wallet-readonly-modal--content button:disabled {
  opacity: 0.4;
}

@media (max-width: 450px) {
  .wallet-readonly-modal {
    place-content: flex-end;
  }
  
  .wallet-readonly-modal > .wallet-readonly-modal--content {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    
    padding-bottom: 100px;
    
    animation: wallet-readonly-modal--content-slide 0.2s ease-in-out;
  }
}
`;

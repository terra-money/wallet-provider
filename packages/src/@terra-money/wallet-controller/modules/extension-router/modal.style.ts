// language=css
export const modalStyle = `
@keyframes wallet-select-modal--dim-enter {
  0% {
    opacity: 0;
  }
  
  100% {
    opacity: 1;
  }
}

@keyframes wallet-select-modal--content-enter {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.wallet-select-modal {
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

.wallet-select-modal > .wallet-select-modal--dim {
  position: fixed;
  z-index: -1;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);

  animation: wallet-select-modal--dim-enter 0.2s ease-in-out;
}

.wallet-select-modal > .wallet-select-modal--content {
  border-radius: 25px;

  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);

  animation: wallet-select-modal--content-enter 0.2s ease-in-out;

  padding: 20px 30px;
}

.wallet-select-modal > .wallet-select-modal--content h1 {
  font-size: 27px;
  font-weight: 500;

  text-align: center;

  margin-bottom: 24px;
}

.wallet-select-modal > .wallet-select-modal--content ul {
  padding: 0;
  list-style: none;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wallet-select-modal > .wallet-select-modal--content ul button {
  border: none;
  background-color: transparent;
  outline: none;
  cursor: pointer;

  display: flex;
  gap: 10px;
  align-items: center;
}

.wallet-select-modal > .wallet-select-modal--content ul button img {
  width: 30px;
  height: 30px;
}

.wallet-select-modal > .wallet-select-modal--content ul button span {
  font-size: 12px;
}
`;

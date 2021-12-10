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
  
  color: #212121;
  
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  
  font-family: sans-serif;
  
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
  box-sizing: border-box;
  
  border-radius: 8px;
  
  background-color: #ffffff;
  box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);
  
  animation: wallet-select-modal--content-enter 0.2s ease-in-out;
  
  width: 100vw;
  max-width: 480px;
  padding: 40px;
}

.wallet-select-modal > .wallet-select-modal--content h1 {
  font-size: 20px;
  font-weight: bold;
  
  margin: 0 0 32px 0;
  
  text-align: center;
}

.wallet-select-modal > .wallet-select-modal--content ul {
  padding: 0;
  margin: 0;
  list-style: none;
  
  display: flex;
  flex-direction: column;
}

.wallet-select-modal > .wallet-select-modal--content ul li {
  border-top: 1px solid #cfd8ea;
}

.wallet-select-modal > .wallet-select-modal--content ul li:last-child {
  border-bottom: 1px solid #cfd8ea;
}

.wallet-select-modal > .wallet-select-modal--content ul button {
  width: 100%;
  height: 66px;
  
  border: none;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  
  display: flex;
  gap: 10px;
  align-items: center;
}

.wallet-select-modal > .wallet-select-modal--content ul button:hover {
  background-color: hsl(220, 39%, 86%, 0.25);
}

.wallet-select-modal > .wallet-select-modal--content ul button .wallet-select-modal--icon {
  display: inline-grid;
  width: 50px;
  height: 50px;
  
  place-content: center;
}

.wallet-select-modal > .wallet-select-modal--content ul button .wallet-select-modal--icon img {
  width: 30px;
  height: 30px;
}

.wallet-select-modal > .wallet-select-modal--content ul button .wallet-select-modal--description {
  flex: 1;
  text-align: left;
  
  font-size: 16px;
  font-weight: 600;
  color: #212121;
}

.wallet-select-modal > .wallet-select-modal--content ul button svg {
  width: 18px;
  height: 18px;
  
  fill: #cfd8ea;
}

.wallet-select-modal > .wallet-select-modal--content ul button:hover svg {
  fill: #2043b5;
}

@media (max-width: 450px) {
  .wallet-select-modal {
    place-content: flex-end;
  }
  
  .wallet-select-modal > .wallet-select-modal--content {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
`;

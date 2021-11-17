import { fixHMR } from 'fix-hmr';
import { createElement } from 'react';
import { render } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { ChromeExtensionInfo } from './multiChannel';

export function defaultSelectModal(
  extensionInfos: ChromeExtensionInfo[],
): Promise<ChromeExtensionInfo | null> {
  return new Promise<ChromeExtensionInfo | null>((resolve) => {
    const modalContainer = window.document.createElement('div');

    function onComplete(extensionInfo: ChromeExtensionInfo | null) {
      resolve(extensionInfo);
      modalContainer.parentElement?.removeChild(modalContainer);
    }

    const modal = createElement(Modal, {
      extensionInfos,
      onComplete,
    });

    render(modal, modalContainer);
    window.document.querySelector('body')?.appendChild(modalContainer);
  });
}

function Component({
  className,
  extensionInfos,
  onComplete,
}: {
  className?: string;
  extensionInfos: ChromeExtensionInfo[];
  onComplete: (extensionInfo: ChromeExtensionInfo | null) => void;
}) {
  return (
    <div className={className}>
      <div onClick={() => onComplete(null)} />
      <section>
        <h1>Select a wallet</h1>

        <ul>
          {extensionInfos.map((extensionInfo) => (
            <li key={extensionInfo.identifier}>
              <button onClick={() => onComplete(extensionInfo)}>
                <img src={extensionInfo.icon} alt={extensionInfo.name} />
                <span>{extensionInfo.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const modalEnter = keyframes`
  0% {
    opacity: 0;
  }
  
  100% {
    opacity: 1;
  }
`;

const sectionEnter = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const StyledComponent = styled(Component)`
  position: fixed;
  z-index: 100000;

  color: #000000;

  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  display: grid;
  place-content: center;

  > div {
    position: fixed;
    z-index: -1;

    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);

    animation: ${modalEnter} 0.2s ease-in-out;
  }

  > section {
    border-radius: 25px;

    background-color: #ffffff;
    box-shadow: 0 4px 18px 3px rgba(0, 0, 0, 0.43);

    animation: ${sectionEnter} 0.2s ease-in-out;

    padding: 20px 30px;

    h1 {
      font-size: 27px;
      font-weight: 500;

      text-align: center;

      margin-bottom: 24px;
    }

    ul {
      padding: 0;
      list-style: none;

      display: flex;
      flex-direction: column;
      gap: 10px;

      button {
        border: none;
        background-color: transparent;
        outline: none;
        cursor: pointer;

        display: flex;
        gap: 10px;
        align-items: center;

        img {
          width: 30px;
          height: 30px;
        }

        span {
          font-size: 12px;
        }
      }
    }
  }
`;

const Modal = fixHMR(StyledComponent);

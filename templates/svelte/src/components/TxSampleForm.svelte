<script lang="ts">
  import { Fee, MsgSend } from '@terra-money/terra.js';
  import {
    ConnectedWallet,
    CreateTxFailed,
    Timeout,
    TxFailed,
    TxResult,
    TxUnspecifiedError,
    UserDenied,
  } from '@terra-money/wallet-controller';
  
  const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

  export let connectedWallet: ConnectedWallet;
  
  let txResult: TxResult | null = null;
  let txError: string | null = null;
  
  function proceed() {
    if (connectedWallet.network.chainID.startsWith('columbus')) {
      alert(`Please only execute this example on Testnet`);
      return;
    }
  
    connectedWallet
      .post({
        fee: new Fee(1000000, '200000uusd'),
        msgs: [
          new MsgSend(connectedWallet.terraAddress, TEST_TO_ADDRESS, {
            uusd: 1000000,
          }),
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        txResult = nextTxResult;
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          txError = 'User Denied';
        } else if (error instanceof CreateTxFailed) {
          txError = 'Create Tx Failed: ' + error.message;
        } else if (error instanceof TxFailed) {
          txError = 'Tx Failed: ' + error.message;
        } else if (error instanceof Timeout) {
          txError = 'Timeout';
        } else if (error instanceof TxUnspecifiedError) {
          txError = 'Unspecified Error: ' + error.message;
        } else {
          txError =
            'Unknown Error: ' +
            (error instanceof Error ? error.message : String(error));
        }
      });
  }
  
  function clearResult() {
    txResult = null;
    txError = null;
  }
</script>

{#if !!txResult}
  <pre>{JSON.stringify(txResult, null, 2)}</pre>
  <div>
    <a
      href="https://finder.terra.money/{connectedWallet.network.chainID}/tx/{txResult.result.txhash}"
      target="_blank"
      rel="noreferrer">
      Open Tx Result in Terra Finder
    </a>
  </div>
  <button on:click={clearResult}>Clear result</button>
{:else if !!txError}
  <pre>{txError}</pre>
  <button on:click={clearResult}>Clear result</button>
{:else}
  <button on:click={proceed}>Send 1USD to { TEST_TO_ADDRESS }</button>
{/if}
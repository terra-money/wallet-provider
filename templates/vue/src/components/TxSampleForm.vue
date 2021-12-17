<script setup lang="ts">
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
import { ref, toRefs } from 'vue';

const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

const props = defineProps<{
  connectedWallet: ConnectedWallet;
}>();

const { connectedWallet } = toRefs(props);

const txResult = ref<TxResult | null>(null);
const txError = ref<string | null>(null);

function proceed() {
  if (connectedWallet.value.network.chainID.startsWith('columbus')) {
    alert(`Please only execute this example on Testnet`);
    return;
  }

  connectedWallet.value
    .post({
      fee: new Fee(1000000, '200000uusd'),
      msgs: [
        new MsgSend(connectedWallet.value.terraAddress, TEST_TO_ADDRESS, {
          uusd: 1000000,
        }),
      ],
    })
    .then((nextTxResult) => {
      console.log(nextTxResult);
      txResult.value = nextTxResult;
    })
    .catch((error) => {
      if (error instanceof UserDenied) {
        txError.value = 'User Denied';
      } else if (error instanceof CreateTxFailed) {
        txError.value = 'Create Tx Failed: ' + error.message;
      } else if (error instanceof TxFailed) {
        txError.value = 'Tx Failed: ' + error.message;
      } else if (error instanceof Timeout) {
        txError.value = 'Timeout';
      } else if (error instanceof TxUnspecifiedError) {
        txError.value = 'Unspecified Error: ' + error.message;
      } else {
        txError.value =
          'Unknown Error: ' +
          (error instanceof Error ? error.message : String(error));
      }
    });
}

function clearResult() {
  txResult.value = null;
  txError.value = null;
}
</script>

<template>
  <div v-if="!!txResult">
    <pre>{{ JSON.stringify(txResult, null, 2) }}</pre>
    <div>
      <a
        href="https://finder.terra.money/{{connectedWallet.network.chainID}}/tx/{{txResult.result.txhash}}"
        target="_blank"
        rel="noreferrer"
        >Open Tx Result in Terra Finder</a
      >
    </div>
    <button v-on:click="clearResult">Clear result</button>
  </div>
  <div v-else-if="!!txError">
    <pre>{{ txError }}</pre>
    <button v-on:click="clearResult">Clear result</button>
  </div>
  <div v-else>
    <button v-on:click="proceed">Send 1USD to {{ TEST_TO_ADDRESS }}</button>
  </div>
</template>

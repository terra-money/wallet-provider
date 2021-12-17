<script setup lang="ts">
import { ConnectedWallet } from '@terra-money/wallet-controller';
import TxSampleForm from 'components/TxSampleForm.vue';
import { getController } from 'controller';
import { Subscription } from 'rxjs';
import { onMounted, onUnmounted, ref } from 'vue';

const status = ref<'initializing' | 'not-connected' | 'can-not-post' | 'ready'>(
  'initializing',
);

const connectedWallet = ref<ConnectedWallet | undefined>(undefined);

let subscription: Subscription | null = null;

onMounted(() => {
  const controller = getController();

  subscription = controller.connectedWallet().subscribe((_connectedWallet) => {
    connectedWallet.value = _connectedWallet;

    if (_connectedWallet) {
      if (!_connectedWallet.availablePost) {
        status.value = 'can-not-post';
      } else {
        status.value = 'ready';
      }
    } else {
      status.value = 'not-connected';
    }
  });
});

onUnmounted(() => {
  subscription?.unsubscribe();
});
</script>

<template>
  <h1>Tx Sample</h1>
  <p v-if="status === 'initializing'">Initializing...</p>
  <p v-else-if="status === 'can-not-post'">
    This connection does not support post()
  </p>
  <p v-else-if="status === 'not-connected'">Wallet not connected!</p>
  <TxSampleForm
    v-else-if="!!connectedWallet"
    v-bind:connected-wallet="connectedWallet"
  />
</template>

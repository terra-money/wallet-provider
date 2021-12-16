<script setup lang="ts">
import {
  NetworkInfo,
  WalletInfo,
  WalletStatus,
} from '@terra-money/wallet-controller';
import TxSampleForm from 'components/TxSampleForm.vue';
import { getController } from 'controller';
import { Subscription } from 'rxjs';
import { onMounted, onUnmounted, ref } from 'vue';

const status = ref<'initializing' | 'not-connected' | 'can-not-post' | 'ready'>(
  'initializing',
);

const controller = getController();

const network = ref<NetworkInfo | null>(null);

const wallet = ref<WalletInfo | null>(null);

let subscription: Subscription | null = null;

onMounted(() => {
  subscription = controller.states().subscribe((states) => {
    if (states.status === WalletStatus.WALLET_CONNECTED) {
      if (!states.supportFeatures.has('post')) {
        status.value = 'can-not-post';
      } else {
        status.value = 'ready';
        network.value = states.network;
        wallet.value = states.wallets[0];
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
    v-else-if="!!controller && !!network && !!wallet"
    v-bind:controller="controller"
    v-bind:network="network"
    v-bind:wallet="wallet"
  />
</template>

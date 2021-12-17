<script setup lang="ts">
import { Coins, LCDClient } from '@terra-money/terra.js';
import { ConnectedWallet } from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { Subscription } from 'rxjs';
import { onMounted, onUnmounted, ref } from 'vue';

const controller = getController();

const connectedWallet = ref<ConnectedWallet | undefined>(undefined);
const balance = ref<Coins | null>(null);

let subscription: Subscription | null = null;

onMounted(() => {
  subscription = controller.connectedWallet().subscribe((_connectedWallet) => {
    connectedWallet.value = _connectedWallet;

    if (_connectedWallet) {
      const lcd = new LCDClient({
        URL: _connectedWallet.network.lcd,
        chainID: _connectedWallet.network.chainID,
      });

      lcd.bank.balance(_connectedWallet.terraAddress).then(([coins]) => {
        balance.value = coins;
      });
    } else {
      balance.value = null;
    }
  });
});

onUnmounted(() => {
  subscription?.unsubscribe();
  connectedWallet.value = undefined;
});
</script>

<template>
  <h1>Query Sample</h1>
  <p v-if="!connectedWallet">Wallet not connected!</p>
  <pre v-else-if="!!balance">{{ balance.toString() }}</pre>
</template>

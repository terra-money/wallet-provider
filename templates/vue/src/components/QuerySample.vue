<script setup lang="ts">
import { Coins, LCDClient } from '@terra-money/terra.js';
import { WalletStatus } from '@terra-money/wallet-controller';
import { getController } from 'controller';
import { Subscription } from 'rxjs';
import { onMounted, onUnmounted, ref } from 'vue';

const controller = getController();

const connected = ref<boolean>(false);
const balance = ref<Coins | null>(null);

let subscription: Subscription | null = null;

onMounted(() => {
  subscription = controller.states().subscribe((states) => {
    if (states.status === WalletStatus.WALLET_CONNECTED) {
      connected.value = true;

      const lcd = new LCDClient({
        URL: states.network.lcd,
        chainID: states.network.chainID,
      });

      lcd.bank.balance(states.wallets[0].terraAddress).then(([coins]) => {
        balance.value = coins;
      });
    } else {
      connected.value = false;
      balance.value = null;
    }
  });
});

onUnmounted(() => {
  subscription?.unsubscribe();
});
</script>

<template>
  <h1>Query Sample</h1>
  <p v-if="!connected">Wallet not connected!</p>
  <pre v-else-if="!!balance">{{ balance.toString() }}</pre>
</template>

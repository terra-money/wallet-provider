<script lang="ts">
  import { Coins, LCDClient } from '@terra-money/terra.js';
  import { WalletStatus } from '@terra-money/wallet-controller';
  import { getController } from 'controller';
  import { Subscription } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  
  const controller = getController()
  
  let connected = false;
  let balance: Coins | null = null;
  
  let subscription: Subscription | null = null;
  
  onMount(() => {
    subscription = controller.states().subscribe((states) => {
      if (states.status === WalletStatus.WALLET_CONNECTED) {
        connected = true;
  
        const lcd = new LCDClient({
          URL: states.network.lcd,
          chainID: states.network.chainID,
        });
  
        lcd.bank.balance(states.wallets[0].terraAddress).then(([coins]) => {
          balance = coins;
        });
      } else {
        connected = false;
        balance = null;
      }
    });
  });
  
  onDestroy(() => {
    subscription?.unsubscribe();
  });
</script>

<h1>
  Query Sample
</h1>

{#if !connected}
  <p>Wallet not connected!</p>
{:else if !!balance}
  <pre>{balance.toString()}</pre>
{/if}
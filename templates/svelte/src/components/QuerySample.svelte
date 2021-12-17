<script lang="ts">
  import { Coins } from '@terra-money/terra.js';
  import { ConnectedWallet, createLCDClient } from '@terra-money/wallet-controller';
  import { getController } from 'controller';
  import { Subscription } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  
  const controller = getController()
  
  let connectedWallet: ConnectedWallet | undefined = undefined;
  let balance: Coins | null = null;
  
  let subscription: Subscription | null = null;
  
  onMount(() => {
    subscription = controller.connectedWallet().subscribe((_connectedWallet) => {
      connectedWallet = _connectedWallet;
      
      if (_connectedWallet) {
        const lcd = createLCDClient({network: _connectedWallet.network});
  
        lcd.bank.balance(_connectedWallet.terraAddress).then(([coins]) => {
          balance = coins;
        });
      } else {
        balance = null;
      }
    });
  });
  
  onDestroy(() => {
    subscription?.unsubscribe();
    connectedWallet = undefined;
  });
</script>

<h1>
  Query Sample
</h1>

{#if !connectedWallet}
  <p>Wallet not connected!</p>
{:else if !!balance}
  <pre>{balance.toString()}</pre>
{/if}
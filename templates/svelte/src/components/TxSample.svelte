<script lang="ts">
  import { NetworkInfo, WalletInfo, WalletStatus } from '@terra-money/wallet-controller';
  import { getController } from 'controller';
  import { Subscription } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  import TxSampleForm from './TxSampleForm.svelte';

  let status: 'initializing' | 'not-connected' | 'can-not-post' | 'ready' = 'initializing';
  
  const controller = getController();
  
  let network: NetworkInfo | null = null;
  let wallet: WalletInfo | null;
  
  let subscription: Subscription | null = null;
  
  onMount(() => {
    subscription = controller.states().subscribe((states) => {
      if (states.status === WalletStatus.WALLET_CONNECTED) {
        if (!states.supportFeatures.has('post')) {
          status = 'can-not-post';
        } else {
          status = 'ready';
          network = states.network;
          wallet = states.wallets[0];
        }
      } else {
        status = 'not-connected';
      }
    });
  });
  
  onDestroy(() => {
    subscription?.unsubscribe();
  });
</script>

<h1>
  Tx Sample
</h1>
{#if status === 'initializing'}
  <p>Initializing...</p>
{:else if status === 'can-not-post'}
  <p>This connection does not support post()</p>
{:else if status === 'not-connected'}
  <p>Wallet not connected!</p>
{:else if !!controller && !!network && !!wallet}
  <TxSampleForm controller={controller} wallet={wallet} network={network}/>
{/if}
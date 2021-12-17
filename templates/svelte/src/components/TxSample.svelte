<script lang="ts">
  import { ConnectedWallet } from '@terra-money/wallet-controller';
  import { getController } from 'controller';
  import { Subscription } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  import TxSampleForm from './TxSampleForm.svelte';
  
  let status: 'initializing' | 'not-connected' | 'can-not-post' | 'ready' = 'initializing';
  
  let connectedWallet: ConnectedWallet | undefined = undefined;
  let subscription: Subscription | null = null;
  
  onMount(() => {
    const controller = getController();
    
    subscription = controller.connectedWallet().subscribe((_connectedWallet) => {
      connectedWallet = _connectedWallet;
      
      if (_connectedWallet) {
        if (!_connectedWallet.availablePost) {
          status = 'can-not-post';
        } else {
          status = 'ready';
        }
      } else {
        status = 'not-connected';
      }
    });
  });
  
  onDestroy(() => {
    subscription?.unsubscribe();
    connectedWallet = undefined;
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
{:else if !!connectedWallet}
  <TxSampleForm connectedWallet={connectedWallet} />
{/if}
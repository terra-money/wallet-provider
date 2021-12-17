<script lang="ts">
  import { initController } from 'controller';
  import ConnectSample from './components/ConnectSample.svelte';
  import QuerySample from './components/QuerySample.svelte';
  import TxSample from './components/TxSample.svelte';
  
  let initialized = false;
  
  initController().then(() => {
    initialized = true;
  });
</script>

{#if !initialized}
  <div>Initializing...</div>
{:else}
  <ConnectSample />
  <QuerySample />
  <TxSample />
{/if}

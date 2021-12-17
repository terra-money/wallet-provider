<script lang="ts">
  import { Connection, ConnectType, WalletStates, WalletStatus } from '@terra-money/wallet-controller';
  import { getController } from 'controller';
  import { combineLatest, Subscription } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  
  const controller = getController()
  
  let availableConnectTypes: ConnectType[] = [];
  let availableInstallTypes: ConnectType[] = [];
  let availableConnections: Connection[] = [];
  let states: WalletStates | null = null;
  let supportFeatures: string[] = [];
  
  let subscription: Subscription | null = null;
  
  onMount(() => {
    subscription = combineLatest([
      controller.availableConnectTypes(),
      controller.availableInstallTypes(),
      controller.availableConnections(),
      controller.states(),
    ]).subscribe(
      ([
        _availableConnectTypes,
        _availableInstallTypes,
        _availableConnections,
        _states,
      ]) => {
        availableInstallTypes = _availableInstallTypes;
        availableConnectTypes = _availableConnectTypes;
        availableConnections = _availableConnections;
        states = _states;
        supportFeatures =
          _states.status === WalletStatus.WALLET_CONNECTED
            ? Array.from(_states.supportFeatures)
            : [];
      },
    );
  });
  
  onDestroy(() => {
    subscription?.unsubscribe();
  });
</script>

<h1>
  Connect Sample
</h1>

{#if !!states}
  <pre>
  {
    JSON.stringify(
      {
        availableConnectTypes,
        availableInstallTypes,
        availableConnections,
        states,
        supportFeatures,
      },
      null,
      2,
    )
  }
  </pre>
{/if}

<footer>
{#if states?.status === WalletStatus.WALLET_NOT_CONNECTED}
  {#each availableInstallTypes as connectType}
    <button on:click={() => controller.install(connectType)}>
      Install {connectType}
    </button>
  {/each}
  {#each availableConnectTypes as connectType}
    <button on:click={() => controller.connect(connectType)}>
      Connect {connectType}
    </button>
  {/each}
  <br/>
  {#each availableConnections as connection}
    <button on:click={() => controller.connect(connection.type, connection.identifier)}>
      <img src={connection.icon} alt={connection.name} style="width: 1em; height: 1em" />
      {connection.name} [{connection.identifier}]
    </button>
  {/each}
{:else if states?.status === WalletStatus.WALLET_CONNECTED}
  <button on:click={() => controller.disconnect()}>
    Disconnect
  </button>
{/if}
</footer>
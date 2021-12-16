<script setup lang="ts">
import { initController } from 'controller';
import { ref } from 'vue';
import ConnectSample from './components/ConnectSample.vue';
import QuerySample from './components/QuerySample.vue';
import TxSample from './components/TxSample.vue';

const initialized = ref<boolean>(false);

initController().then(() => {
  initialized.value = true;
});
</script>

<template>
  <div v-if="!initialized">Initializing...</div>
  <div v-else>
    <ConnectSample />
    <QuerySample />
    <TxSample />
  </div>
</template>

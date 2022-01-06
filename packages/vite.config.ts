import reactRefresh from '@vitejs/plugin-react-refresh';
import * as path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@terra-money/terra.js': '@terra-money/terra.js/dist/bundle.js',
      'process': path.resolve(__dirname, 'src/polyfills/process-es6.js'),
      'readable-stream': 'vite-compatible-readable-stream',
    },
  },
  //define: {
  //  'process.env': {},
  //},
  server: {
    https: {
      cert: process.env.LOCALHOST_HTTPS_CERT,
      key: process.env.LOCALHOST_HTTPS_KEY,
      //@ts-ignore
      maxSessionMemory: 100,
      peerMaxConcurrentStreams: 300,
    },
  },
  plugins: [reactRefresh(), tsconfigPaths(), svgr()],
  //build: {
  //  sourcemap: true,
  //  rollupOptions: {
  //    input: {
  //      main: path.resolve(__dirname, 'index.html'),
  //      subpage: path.resolve(__dirname, 'subpage.html'),
  //    },
  //  },
  //},
});

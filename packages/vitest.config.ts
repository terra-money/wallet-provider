import reactRefresh from '@vitejs/plugin-react-refresh';
import * as path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'process': path.resolve(__dirname, 'src/polyfills/process-es6.js'),
      'readable-stream': 'vite-compatible-readable-stream',
    },
  },
  plugins: [reactRefresh(), tsconfigPaths(), svgr()],
});

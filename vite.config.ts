import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pocketBaseProxy = {
  target: 'http://127.0.0.1:8090',
  changeOrigin: true,
  secure: false,
};

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5180,
    proxy: {
      '/api': pocketBaseProxy,
      '/_/': pocketBaseProxy,
    },
  },
  preview: {
    proxy: {
      '/api': pocketBaseProxy,
      '/_/': pocketBaseProxy,
    },
  },
});

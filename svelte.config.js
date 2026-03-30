import sveltePreprocess from 'svelte-preprocess';

/** @type {import('vite').UserConfig} */
const config = {
  preprocess: sveltePreprocess({ typescript: true }),
};

export default config;

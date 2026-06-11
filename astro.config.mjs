// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // The site is fully prerendered except /api/subscribe, which runs
  // on the server so the Buttondown API key stays secret.
  adapter: node({ mode: 'standalone' }),
});

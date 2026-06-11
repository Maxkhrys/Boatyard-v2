// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Static site with on-demand API routes (e.g. /api/subscribe) running as
// Vercel serverless functions.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
});

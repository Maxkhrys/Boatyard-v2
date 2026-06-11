// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import vercel from '@astrojs/vercel';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? 'production';

// Static site with on-demand API routes (e.g. /api/subscribe) and
// Sanity Studio at /admin (when SANITY_PROJECT_ID is set) running as
// Vercel serverless functions.
const integrations = [react()];

if (projectId) {
  integrations.push(
    sanity({
      projectId,
      dataset,
      studioBasePath: '/admin',
      useCdn: false,
    }),
  );
}

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations,
});

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiToken = process.env.SANITY_API_TOKEN;

const integrations = [
  react(),
  sitemap({
    filter: (page) =>
      !page.includes('/admin') &&
      !page.includes('/api/') &&
      !page.includes('/vouchers/success'),
  }),
];

if (projectId) {
  integrations.push(
    sanity({
      projectId,
      dataset,
      studioBasePath: '/admin',
      useCdn: false,
      ...(apiToken && { apiToken }),
    }),
  );
}

export default defineConfig({
  site: 'https://www.theboatyardsauna.io',
  output: 'static',
  adapter: vercel(),
  integrations,
});

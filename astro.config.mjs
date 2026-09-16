import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://getrefined.github.io',
  base: '/quietroom_website/',
  compressHTML: true,
  integrations: [sitemap()],
});

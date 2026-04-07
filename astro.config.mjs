// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import keystatic from "@keystatic/astro";

import react from "@astrojs/react";

// https://astro.build/config
// Static mode with SSR support: pages are static by default; Keystatic admin routes opt into SSR.
// Add `export const prerender = false` to any page that needs server rendering.
export default defineConfig({
  output: "static",
  adapter: cloudflare(),
  site: "https://whiterabbitwcs.com",
  integrations: [sitemap(), keystatic(), react()],
});
// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
// Static mode with Cloudflare adapter for optional SSR support
// Pages are static by default, add `export const prerender = false` to make them server-rendered
export default defineConfig({
  output: "static",
  adapter: cloudflare(),
  site: "https://whiterabbitwcs.com",
});

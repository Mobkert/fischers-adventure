import { defineConfig } from "vite";

export default defineConfig({
  // Relative paths work locally and on GitHub Pages project sites.
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
});

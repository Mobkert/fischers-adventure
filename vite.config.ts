import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  // Relative paths work locally and on GitHub Pages project sites.
  base: "./",
  resolve: {
    alias:
      mode === "production"
        ? {
            [path.resolve(root, "src/game/dev/DevGrants.ts")]: path.resolve(
              root,
              "src/game/dev/DevGrants.stub.ts"
            ),
          }
        : {},
  },
  server: {
    port: 5173,
    open: true,
  },
}));

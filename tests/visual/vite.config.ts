import { defineConfig } from "vite";
import path from "node:path";
const root = process.cwd();
export default defineConfig({
  root: path.resolve(root, "tests/visual"),
  resolve: {
    alias: [
      {
        find: "next/link",
        replacement: path.resolve(root, "tests/visual/next-link.tsx"),
      },
      {
        find: "next/navigation",
        replacement: path.resolve(root, "tests/visual/navigation.ts"),
      },
      {
        find: /^@\/app\/.*actions$/,
        replacement: path.resolve(root, "tests/visual/actions.ts"),
      },
      { find: "@", replacement: path.resolve(root, "src") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3100,
    strictPort: true,
    fs: { allow: [root] },
  },
});

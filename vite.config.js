import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    build: {
        target: ["esnext"],
        rollupOptions: {
            input: "src/Run.ts", // run.jsのパス
            output: {
                entryFileNames: "Run.js",
                dir: "dist",
            },
        },
        sourcemap: true,
    },
});

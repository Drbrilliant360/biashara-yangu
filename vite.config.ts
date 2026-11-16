import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Native (Capacitor) builds must not pull remote scripts: App Store review and
// offline use both require the bundle to be self-contained.
const stripRemoteScripts = (): Plugin => ({
  name: "strip-remote-scripts",
  transformIndexHtml(html) {
    return html
      .replace(/\s*<!-- IMPORTANT: DO NOT REMOVE[^>]*-->\n?/, "\n")
      .replace(/\s*<script src="https:\/\/cdn\.gpteng\.co[^>]*><\/script>\n?/, "\n");
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isNativeBuild = mode === "native";
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      isNativeBuild && stripRemoteScripts(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Mobile-friendly: split heavy vendor libs so first paint loads far less JS.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            supabase: ["@supabase/supabase-js"],
            charts: ["recharts"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});

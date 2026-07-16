import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

// Build stamp: short git hash ("+" if the working tree had uncommitted
// changes) and date — shown in the app footer so any deployed build is
// identifiable at a glance.
let gitHash = "unknown";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
  if (execSync("git status --porcelain").toString().trim()) gitHash += "+";
} catch {
  // not a git checkout — leave "unknown"
}

export default defineConfig({
  // deployed under https://hildner.org/slowbend/
  base: "/slowbend/",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_INFO__: JSON.stringify(
      `${gitHash} · ${new Date().toISOString().slice(0, 10)}`,
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Slowbend",
        short_name: "Slowbend",
        description:
          "Musician's practice player — slow down, change the pitch, loop sections of any audio file.",
        display: "standalone",
        background_color: "#101014",
        theme_color: "#16161c",
        icons: [
          { src: "icons/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
    }),
  ],
});

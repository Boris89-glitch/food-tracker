import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable-512.png"],
      manifest: {
        name: "Food Tracker",
        short_name: "Food Tracker",
        description:
          "Track your daily calories, meals, and weight — synced across your devices.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#eef1f5",
        theme_color: "#16a34a",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Cache the app shell; let Firebase Auth/Firestore traffic hit the
        // network directly (same policy as the old hand-written sw.js).
        globPatterns: ["**/*.{js,css,html,png,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/__/]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Keep the big third-party libraries in their own long-cacheable chunks.
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          chart: ["chart.js"],
          react: ["react", "react-dom"]
        }
      }
    }
  }
});

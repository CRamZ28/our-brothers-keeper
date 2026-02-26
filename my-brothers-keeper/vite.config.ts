import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";


const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  // PWA plugin disabled during development to prevent caching issues
  // Re-enable for production builds if needed
  ...(process.env.NODE_ENV === 'production' ? [VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
    manifest: {
      name: "Our Brother's Keeper",
      short_name: "OBK",
      description: "A compassionate platform to coordinate support for families during difficult times",
      theme_color: "#0d9488",
      background_color: "#ffffff",
      display: "standalone",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    },
    workbox: {
      // Exclude HTML and large JS bundles from precaching
      globPatterns: ["**/*.{css,ico,svg,woff,woff2}"],
      globIgnores: ["**/waves-bg.png", "**/obk-emblem.png", "**/obk-logo.png", "**/obk-logo-v2.png", "**/obk-symbol.png"],
      // Increase limit for remaining assets, but use runtime caching for large JS
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
      // Don't cache during navigation to ensure fresh HTML
      navigateFallback: null,
      runtimeCaching: [
        {
          // Runtime cache for JavaScript bundles (more efficient than precaching large files)
          urlPattern: /\.js$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "js-cache",
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          // Always fetch fresh HTML from network
          urlPattern: /\.html$/,
          handler: "NetworkFirst",
          options: {
            cacheName: "html-cache",
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 // 1 hour only
            }
          }
        },
        {
          // Cache large brand images at runtime instead of precaching
          urlPattern: /\/(waves-bg|obk-emblem|obk-logo|obk-logo-v2|obk-symbol)\.png$/,
          handler: "CacheFirst",
          options: {
            cacheName: "large-images-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        },
        {
          urlPattern: /^https:\/\/api\..*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  })] : [])
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

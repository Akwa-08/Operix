import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ICON.png', 'vite.svg'],
      manifest: {
        name: 'Operix Management System',
        short_name: 'Operix',
        description: 'Advanced Production and Order Management System',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: 'ICON.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Orders',
            url: '/admin/orders',
            icons: [{ src: 'ICON.png', sizes: '192x192' }]
          },
          {
            name: 'Inventory',
            url: '/admin/inventory',
            icons: [{ src: 'ICON.png', sizes: '192x192' }]
          },
          {
            name: 'Messages',
            url: '/admin/messages',
            icons: [{ src: 'ICON.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: [{find: "@mui/styled-engine", replacement: "@mui/styled-engine-sc"}],
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});

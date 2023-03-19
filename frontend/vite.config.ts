import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: { alias: { mqtt: 'mqtt/dist/mqtt.js', }, },
  plugins: [react(),
     checker({ typescript: true }),
     VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: {
        icons:[
          {
            src: './icon.png',
            sizes: '144x144',
            type: 'image/png'
          }
        ],
      }
    }),
  ],
})
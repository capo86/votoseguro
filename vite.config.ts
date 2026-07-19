import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      includeAssets: [
        "logo-ppc-oficial.png",
        "og-votoseguro-ppc.png",
        "pwa/favicon-16.png",
        "pwa/favicon-32.png",
        "pwa/apple-touch-icon-152.png",
        "pwa/apple-touch-icon-167.png",
        "pwa/apple-touch-icon-180.png",
        "pwa/splash-logo.png",
      ],
      manifest: {
        name: "VotoSeguro PPC",
        short_name: "VotoSeguro",
        description:
          "PPC, Partido de la Participación Ciudadana. Plataforma de carga de Voto Seguro para gestión territorial electoral.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#F2820C",
        background_color: "#fff7ee",
        lang: "es-PY",
        categories: ["productivity", "utilities"],
        icons: [
          {
            src: "/pwa/ppc-logo-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/ppc-logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/ppc-logo-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa/ppc-logo-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [],
      },
    }),
  ],
});

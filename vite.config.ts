import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  // En dev usar "/" evita rutas raras; en build "./" hace que Capacitor/WebView cargue los assets
  base: command === "build" ? "./" : "/",
  // Solo el index.html de la raíz: evita que Vite escanee el bundle copiado en android/ tras cap sync
  optimizeDeps: {
    entries: [path.resolve(__dirname, "index.html")],
    include: ["@emotion/is-prop-valid"],
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ["**/android/**", "**/ios/**"],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{find: "@mui/styled-engine", replacement: "@mui/styled-engine-sc"}],
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});

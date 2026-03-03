import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Redirect MUI's default emotion styled engine to styled-components
// when using `@mui/styled-engine-sc`.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{find: "@mui/styled-engine", replacement: "@mui/styled-engine-sc"}],
  },
});

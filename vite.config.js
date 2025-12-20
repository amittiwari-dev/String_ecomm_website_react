import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Ensure proper SPA routing for production builds
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    // Ensure environment variables are properly defined
    __ALLOW_MOCK_DATA__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});

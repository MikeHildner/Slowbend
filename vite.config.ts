import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // deployed under https://hildner.org/slowbend/
  base: "/slowbend/",
  plugins: [react()],
});

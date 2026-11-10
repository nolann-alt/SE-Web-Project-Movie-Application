import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/SE-Web-Project-Movie-Application/", // Base URL for Github Pages
  plugins: [react(), tailwindcss()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Na GitHub Pages aplikacja stoi pod /czolko-online/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/czolko-online/' : '/',
  plugins: [react(), tailwindcss()],
})

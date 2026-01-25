import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages - set to your repo name
  // e.g., base: '/chore-tracker/'
  base: './',
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // BELANGRIJK: Vervang 'tankbon-verwerker' door de naam van jouw GitHub repository.
  // Dit zorgt ervoor dat alle bestanden correct worden geladen.
  base: '/bonnenmonster/', 
  build: {
    outDir: 'docs'
  }
})
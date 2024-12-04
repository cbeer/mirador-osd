import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'MiradorOpenSeadragonViewer',
      fileName: 'mirador-osd',
    }
  },
  plugins: [react()]
})

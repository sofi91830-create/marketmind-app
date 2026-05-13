import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Если деплоишь в подпапку (напр. username.github.io/my-app),
  // раскомментируй и укажи имя репо:
  // base: '/my-app/',

  build: {
    outDir: 'dist',
    // Разбиваем бандл на чанки для быстрой загрузки
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },

  server: {
    port: 5173,
    // Для тестирования TMA локально через HTTPS (ngrok и т.п.):
    // https: true,
  },
})

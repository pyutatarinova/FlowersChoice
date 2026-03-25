import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://backend:3001'
const devMinioProxyTarget = process.env.VITE_DEV_MINIO_PROXY_TARGET || 'http://minio:9000'
const devMinioConsoleProxyTarget = process.env.VITE_DEV_MINIO_CONSOLE_PROXY_TARGET || 'http://minio:9001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/minio': {
        target: devMinioProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio/, ''),
      },
      '/plants': {
        target: devMinioProxyTarget,
        changeOrigin: true,
      },
      '/minio-console': {
        target: devMinioConsoleProxyTarget,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/minio-console/, ''),
      },
    },
  },
})

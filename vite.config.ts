import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // ✅ 추가: 정적 업로드 경로도 백엔드로 프록시
      "/upload": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

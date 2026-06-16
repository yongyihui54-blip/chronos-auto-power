import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

// 默认不启动 Electron 主进程：
// `npm run dev` 纯前端浏览器预览（无 window.chronos，IPC 桥接层自动回退到 mock）。
// 需要真实电源/任务计划后端时使用 `npm run electron:dev`（见 package.json）。
const withElectron = process.env['ELECTRON'] === 'true';

export default defineConfig({
  plugins: [
    react(),
    withElectron &&
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            build: { outDir: 'dist-electron' },
          },
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
          vite: {
            build: { outDir: 'dist-electron' },
          },
        },
        // 纯构建模式才自动拉起 Electron；开发态由 electron:dev 脚本控制
        renderer: {},
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // 与 tsconfig.json paths 保持一致，供 Vite/Rollup 解析
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

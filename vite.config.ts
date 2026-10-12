import { defineConfig } from 'vite';
// target thấp để chạy được trong trình duyệt nhúng cũ (Facebook/Zalo/Messenger in-app WebView trên iOS cũ)
export default defineConfig({ base: './', build: { target: ['es2019', 'safari13'], chunkSizeWarningLimit: 2000 } });

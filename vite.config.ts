import {defineConfig} from 'vite';
export default defineConfig({base:process.env.VITE_BASE || '/',build:{chunkSizeWarningLimit:1800},test:{include:['src/**/*.test.ts']}});

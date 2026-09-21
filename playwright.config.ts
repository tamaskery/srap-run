import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',timeout:60000,workers:1,use:{baseURL:process.env.TEST_URL||'http://127.0.0.1:4173',viewport:{width:1280,height:720},channel:process.env.BROWSER_CHANNEL||'chromium',launchOptions:{args:['--enable-webgl','--ignore-gpu-blocklist']}},reporter:[['list'],['json',{outputFile:'test-results/acceptance.json'}]]});

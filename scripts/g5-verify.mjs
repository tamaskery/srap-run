import {preview} from 'vite';
import {spawn} from 'node:child_process';
const server=await preview({configFile:false,build:{outDir:'dist'},preview:{host:'127.0.0.1',port:4199,strictPort:true}});
try {
 const test=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','tests/architecture.spec.ts','tests/slice.spec.ts','tests/m4.spec.ts','tests/input-browser.spec.ts','tests/world-depth.spec.ts'],{stdio:'inherit',env:{...process.env,TEST_URL:'http://127.0.0.1:4199',BROWSER_CHANNEL:'chrome'}});
 process.exitCode=await new Promise(resolve=>test.on('exit',resolve));
} finally {server.httpServer.close();}

import { defineConfig } from 'vite'
 
export default defineConfig({
  build: {
    target:"esnext",
    lib: {
      entry: "./lib/index.ts",
      formats:["es","umd"],
      name: 'index', 
    },
    copyPublicDir:false,
    minify:false,
  },
 
  server:{
    open:true,
    host: true,
  }
})

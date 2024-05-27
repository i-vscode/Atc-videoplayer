import { defineConfig } from 'vite' 
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({ 
  build: {
    target:"esnext",  
    lib: {
      entry: "./lib/index.ts",
      formats:["es"]
    },
    copyPublicDir:false,
    minify:false,
  },
 
  server:{
    open:true,
    host: true,
  },
  plugins: [ 
    dts({ 
        outDir: "dist/@types", 
        staticImport: false,
        copyDtsFiles: true,
        exclude: ["@src", "vue","entry"], 
        //insertTypesEntry: true,
        //rollupTypes:true
    }),
],
})

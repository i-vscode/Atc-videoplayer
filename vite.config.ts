import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts' 
export default defineConfig({
    build: {
        target: "esnext",
        lib: {
            entry: "./lib/index.ts",
            formats: ["es"]
        },
        copyPublicDir: false,
        minify: false,
    },
    server: {
        open: true,
        host: true,
    },
    plugins: [
        dts({
            entryRoot:"./lib/", 
            staticImport: false,
            copyDtsFiles: true,
            exclude: ["@src", "vue", "entry"], 
        }),
    ],
    resolve: {
        alias: [ 
            { find: '@lib', replacement:'/lib/' }, 
        ],
    }
})

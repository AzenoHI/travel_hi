import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import fs from "fs";
import path from "path";

const keyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
const certPath = path.resolve(__dirname, ".certs/localhost.pem");

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
    ],
    server: {
        https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        },
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },

    },
})

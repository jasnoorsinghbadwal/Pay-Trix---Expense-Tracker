import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to generate a unique build version timestamp
const versionPlugin = () => {
  return {
    name: 'version-plugin',
    buildStart() {
      const version = Date.now().toString();
      
      // Ensure public directory exists and write version.json
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(publicDir, 'version.json'),
        JSON.stringify({ version })
      );

      // Ensure src directory exists and write version.js
      const srcDir = path.resolve(__dirname, 'src');
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(srcDir, 'version.js'),
        `export const APP_VERSION = "${version}";\n`
      );
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin()],
})


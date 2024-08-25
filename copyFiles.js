import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const msghostsrc = path.join(__dirname, 'src-tauri', 'target', 'release', 'pytubepp-helper-msghost.exe');
const msghostdest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost.exe');
const autostartsrc = path.join(__dirname, 'src-tauri', 'target', 'release', 'pytubepp-helper-autostart.exe');
const autostartdest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-autostart.exe');

fs.copyFileSync(msghostsrc, msghostdest);
fs.copyFileSync(autostartsrc, autostartdest);
console.log('Files copied successfully');
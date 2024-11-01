import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const msghostSrc = path.join(__dirname, 'src-tauri', 'target', 'release', 'pytubepp-helper-msghost.exe');
const msghostDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost.exe');
const autostartSrc = path.join(__dirname, 'src-tauri', 'target', 'release', 'pytubepp-helper-autostart.exe');
const autostartDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-autostart.exe');
const msghostManifestWinChromeSrc = path.join(__dirname, 'src-tauri', 'msghost-manifest', 'windows', 'chrome', 'com.neosubhamoy.pytubepp.helper.json');
const msghostManifestWinChromeDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost.json');
const msghostManifestWinFirefoxSrc = path.join(__dirname, 'src-tauri', 'msghost-manifest', 'windows', 'firefox', 'com.neosubhamoy.pytubepp.helper.json');
const msghostManifestWinFirefoxDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost-moz.json');

fs.copyFileSync(msghostSrc, msghostDest);
fs.copyFileSync(autostartSrc, autostartDest);
fs.copyFileSync(msghostManifestWinChromeSrc, msghostManifestWinChromeDest);
fs.copyFileSync(msghostManifestWinFirefoxSrc, msghostManifestWinFirefoxDest);
console.log('Files copied successfully');
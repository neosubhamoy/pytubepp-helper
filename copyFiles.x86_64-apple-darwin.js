import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const msghostSrc = path.join(__dirname, 'src-tauri', 'target', 'x86_64-apple-darwin', 'release', 'pytubepp-helper-msghost');
const msghostDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost');
const autostartPlistSrc = path.join(__dirname, 'src-tauri', 'autostart', 'pytubepp-helper-autostart.plist');
const autostartPlistDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-autostart.plist');
const msghostManifestMacChromeSrc = path.join(__dirname, 'src-tauri', 'msghost-manifest', 'macos', 'chrome', 'com.neosubhamoy.pytubepp.helper.json');
const msghostManifestMacChromeDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost.json');
const msghostManifestMacFirefoxSrc = path.join(__dirname, 'src-tauri', 'msghost-manifest', 'macos', 'firefox', 'com.neosubhamoy.pytubepp.helper.json');
const msghostManifestMacFirefoxDest = path.join(__dirname, 'src-tauri', 'pytubepp-helper-msghost-moz.json');

fs.copyFileSync(msghostSrc, msghostDest);
fs.copyFileSync(autostartPlistSrc, autostartPlistDest);
fs.copyFileSync(msghostManifestMacChromeSrc, msghostManifestMacChromeDest);
fs.copyFileSync(msghostManifestMacFirefoxSrc, msghostManifestMacFirefoxDest);
console.log('Files copied successfully');
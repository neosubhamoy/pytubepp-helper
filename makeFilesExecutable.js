import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binSrc = path.join(__dirname, 'src-tauri', 'binaries');

function makeFilesExecutable() {
  try {
    if (!fs.existsSync(binSrc)) {
      console.error(`Binaries directory does not exist: ${binSrc}`);
      return;
    }

    const files = fs.readdirSync(binSrc);
    const nonExeFiles = files.filter(file => !file.endsWith('.exe'));
    let count = 0;

    for (const file of nonExeFiles) {
      const filePath = path.join(binSrc, file);
      if (fs.statSync(filePath).isFile()) {
        execSync(`chmod +x "${filePath}"`);
        console.log(`Made executable: ${file}`);
        count++;
      }
    }
    
    console.log(`Successfully made ${count} files executable in ${binSrc}`);
  } catch (error) {
    console.error(`Error making files executable: ${error.message}`);
  }
}

makeFilesExecutable();
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Command } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { join, resourceDir, homeDir } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function isInstalled(program: string, arg: string): Promise<{ installed: boolean, output: string | null }> {
  try{
    const output = await Command.create('is-' + program + '-installed', [arg]).execute();
    if (output.code === 0) {
      return { installed: true, output: output.stdout };
    } else {
      return { installed: false, output: output.stdout };
    }
  } catch (error) {
    console.error(program + ':', error);
    return { installed: false, output: null };
  }
}

export async function detectWindows(): Promise<string | null> {
  try{
    const output = await Command.create('detect-windows', []).execute();
    if (output.code === 0) {
      return output.stdout;
    } else {
      return output.stdout;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function detectMacOs(): Promise<string | null> {
  try{
    const output = await Command.create('detect-macos', []).execute();
    if (output.code === 0) {
      return output.stdout;
    } else {
      return output.stdout;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function detectDistro(): Promise<string | null> {
  try{
    const output = await Command.create('detect-distro', ['^ID=', '/etc/os-release']).execute();
    if (output.code === 0) {
      return output.stdout;
    } else {
      return output.stdout;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function detectPackageManager(): Promise<string | null> {
  try{
    const output = await Command.create('detect-pkgmngr', ['-c', 'command -v apt || command -v dnf || command -v pacman']).execute();
    if (output.code === 0) {
      return output.stdout;
    } else {
      return output.stdout;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function extractPkgMngrName(path: string): string | null {
  const pattern = /^\s*(.*\/)?([^\/\s]+)\s*$/;
  const match = path.trim().match(pattern);
  if (!match) return null;
  return match[2];
}

export function extractDistroId(input: string): string | null {
  const regex = /ID=([a-zA-Z]+)/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

export function extractVersion(output: string): string | null {
  const versionPatterns = [
      /ffmpeg version (\d+\.\d+)/,              // Pattern for ffmpeg
      /Python (\d+\.\d+\.\d+)/,                 // Pattern for Python
      /pytubefix (\d+\.\d+\.\d+)/,              // Pattern for pytubefix
      /pytubepp (\d+\.\d+\.\d+)/,               // Pattern for pytubepp
      /v(\d+\.\d+\.\d+)/,                       // Pattern for winget, Node.js
      /pip (\d+\.\d+)/,                         // Pattern for pip
      /OS Version:.*Build (\d+)/,               // Pattern for Windows build
      /apt (\d+\.\d+\.\d+)/,                    // Pattern for apt
      /(\d+\.\d+\.\d+)/,                        // Pattern for dnf
      /Pacman v(\d+\.\d+\.\d+)/,                // Pattern for pacman
      /ProductVersion:\s+(\d+\.\d+(\.\d+)?)/,   // Pattern for macOS version
      /Homebrew (\d+\.\d+\.\d+)/,               // Pattern for Homebrew
  ];
  for (const pattern of versionPatterns) {
      const match = output.match(pattern);
      if (match) {
          return match[1];
      }
  }
  return null;
}

export async function sendStreamInfo(url: string) {
  const fetchData = async () => {
    try {
      const output = await Command.create('fetch-video-info', [url, '--raw-info']).execute();
      if (output.code === 0) {
        console.log(output.stdout);
        const sendStreamData = async () => {
          try {
            await invoke('receive_frontend_response',  { response: output.stdout });
          } catch (error) {
            console.error(error);
          }
        };
        sendStreamData();
      } else {
        console.log(output.stdout);
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}

export function compareVersions (v1: string, v2: string) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
};

export async function registerMacFiles() {
  try {
    const filesToCopy = [
      { source: 'pytubepp-helper-autostart.plist', destination: 'Library/LaunchAgents/com.neosubhamoy.pytubepp.helper.plist', dir: 'Library/LaunchAgents/' },
      { source: 'pytubepp-helper-msghost.json', destination: 'Library/Application Support/Google/Chrome/NativeMessagingHosts/com.neosubhamoy.pytubepp.helper.json', dir: 'Library/Application Support/Google/Chrome/NativeMessagingHosts/' },
      { source: 'pytubepp-helper-msghost.json', destination: 'Library/Application Support/Chromium/NativeMessagingHosts/com.neosubhamoy.pytubepp.helper.json', dir: 'Library/Application Support/Chromium/NativeMessagingHosts/' },
      { source: 'pytubepp-helper-msghost-moz.json', destination: 'Library/Application Support/Mozilla/NativeMessagingHosts/com.neosubhamoy.pytubepp.helper.json', dir: 'Library/Application Support/Mozilla/NativeMessagingHosts/' },
    ];

    const resourceDirPath = await resourceDir();
    const homeDirPath = await homeDir();

    for (const file of filesToCopy) {
      const sourcePath = await join(resourceDirPath, file.source);
      const destinationDir = await join(homeDirPath, file.dir);
      const destinationPath = await join(homeDirPath, file.destination);

      const dirExists = await fs.exists(destinationDir);
      if (dirExists) {
        await fs.copyFile(sourcePath, destinationPath);
        console.log(`File ${file.source} copied successfully to ${destinationPath}`);
      } else {
        await fs.mkdir(destinationDir, { recursive: true })
        console.log(`Created dir ${destinationDir}`);
        await fs.copyFile(sourcePath, destinationPath);
        console.log(`File ${file.source} copied successfully to ${destinationPath}`);
      }
    }
    return { success: true, message: 'Registered successfully' }
  } catch (error) {
    console.error('Error copying files:', error);
    return { success: false, message: 'Failed to register' }
  }
}
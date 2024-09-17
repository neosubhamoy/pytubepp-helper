import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Command } from '@tauri-apps/api/shell';
import { Stream } from "@/types";
import { invoke } from "@tauri-apps/api";

export function extract_xml(input: string): string[] {
  const regex = /<Stream: [^>]+>/g;
  const matches = input.match(regex);
  return matches ? matches : [];
}


function parseAttributes(attributesString: string): Partial<Stream> {
  const attributes: Partial<Stream> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = regex.exec(attributesString)) !== null) {
      const key = match[1];
      const value = match[2];
      if (['itag', 'mime_type', 'res', 'fps', 'vcodec'].includes(key)) {
          attributes[key as keyof Partial<Stream>] = value;
      }
  }

  return attributes;
}

export function convert_xml_to_json(xmlStrings: string[]): Stream[] {
  return xmlStrings
      .map(xmlString => {
          const attributesString = xmlString.replace('<Stream: ', '').replace('>', '');
          return parseAttributes(attributesString);
      })
      .filter(stream => stream.res !== undefined) as Stream[];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function is_installed(program: string, arg: string): Promise<{ installed: boolean, output: string | null }> {
  try{
    const output = await new Command('is-' + program + '-installed', [arg]).execute();
    if (output.code === 0) {
      return { installed: true, output: output.stdout };
    } else {
      return { installed: false, output: output.stdout };
    }
  } catch (error) {
    console.error(error);
    return { installed: false, output: null };
  }
}

export function extract_version(output: string): string | null {
  const versionPatterns = [
      /ffmpeg version (\d+\.\d+)/,      // Pattern for ffmpeg
      /Python (\d+\.\d+\.\d+)/,         // Pattern for Python
      /pytubefix (\d+\.\d+\.\d+)/,      // Pattern for pytubefix
      /pytubepp (\d+\.\d+\.\d+)/,       // Pattern for pytubepp
      /v(\d+\.\d+\.\d+)/,               // Pattern for winget
      /pip (\d+\.\d+)/,                 // Pattern for pip

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
      const output = await new Command('fetch-video-info', [url, '--list']).execute();
      if (output.code === 0) {
        console.log(output.stdout);
        const sendStreamData = async () => {
          try {
            const streamsstr = JSON.stringify(convert_xml_to_json(extract_xml(output.stdout)))
            await invoke('receive_frontend_response',  { response: streamsstr });
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
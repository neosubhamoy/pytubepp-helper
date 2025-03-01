import React from "react"
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ThemeProvider } from "@/components/theme-provider";
import { Config, WebSocketMessage } from "@/types";
import { compareVersions, sendStreamInfo } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { check as checkAppUpdate } from "@tauri-apps/plugin-updater";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { downloadDir, join } from "@tauri-apps/api/path";
import { fetch } from '@tauri-apps/plugin-http';
import * as fs from "@tauri-apps/plugin-fs"

function App({ children }: { children: React.ReactNode }) {
  const appWindow = getCurrentWebviewWindow()
  const [appConfig, setAppConfig] = useState<Config | null>(null);
  const [isAppUpdateChecked, setIsAppUpdateChecked] = useState(false);
  const [isExtensionUpdateChecked, setIsExtensionUpdateChecked] = useState(false);

  // Prevent right click context menu in production
  if (!import.meta.env.DEV) {
    document.oncontextmenu = (event) => {
        event.preventDefault()
    }
  }
  
  useEffect(() => {
    const handleCloseRequested = (event: any) => {
      event.preventDefault();
      appWindow.hide();
    };

    appWindow.onCloseRequested(handleCloseRequested);
  }, []);

  useEffect(() => {
    const getConfig = async () => {
        const config: Config = await invoke("get_config");
        if (config) {
          setAppConfig(config);
        }
    }
    getConfig().catch(console.error);
  }, []);

  useEffect(() => {
    const unlisten = listen<WebSocketMessage>('websocket-message', (event) => {
      if(event.payload.command === 'send-stream-info') {
        sendStreamInfo(event.payload.url);
      } else if(event.payload.command === 'download-stream') {
        const startDownload = async () => {
          try {
            await invoke('download_stream',  { url: event.payload.url, stream: event.payload.argument.split(' ')[0], caption: event.payload.argument.split(' ')[1] });
            await invoke('receive_frontend_response',  { response: 'Download started' });
          } catch (error) {
            console.error(error);
          }
        };
        startDownload();
      } else if (event.payload.command === 'autostart') {
        const handleAppAutostart = async () => {
          appWindow.hide();
          await invoke('receive_frontend_response',  { response: 'Appwindow Hidden' });
        };
        handleAppAutostart();
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  useEffect(() => {
    const checkForUpdates = async () => {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }
        try {
          setIsAppUpdateChecked(true);
          const update = await checkAppUpdate();
          if (update) {
            console.log(`app update available v${update.version}`);
            if (permissionGranted) {
              sendNotification({ title: `Update Available (v${update.version})`, body: `A newer version of PytubePP Helper is available. Please update to the latest version to get the best experience!` });
            }
          }
        } catch (error) {
          console.error(error);
        }
    };

    const checkForExtensionUpdates = async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      try {
          setIsExtensionUpdateChecked(true)
          const downloadDirPath = await downloadDir()
          const extensionManifestPath = await join(downloadDirPath, "pytubepp-extension-chrome", "manifest.json")
          const extensionManifestExists = await fs.exists(extensionManifestPath)
          if (extensionManifestExists) {
              const currentManifest = JSON.parse(await fs.readTextFile(extensionManifestPath))
              const response = await fetch('https://github.com/neosubhamoy/pytubepp-extension/releases/latest/download/latest.json', {
                method: 'GET',
              });
              if (response.ok) {
                const data = await response.json()
                if (compareVersions(data.version, currentManifest.version) === 1) {
                  console.log(`extension update available v${data.version}`);
                  if (permissionGranted) {
                    sendNotification({ title: `Extension Update Available (v${data.version})`, body: `A newer version of PytubePP Extension is available. Please update to the latest version to get the best experience!` });
                  }
                }
              }
              else {
                console.error('Failed to fetch latest extension version');
              }
          } else {
              console.log('Currently installed extension\'s manifest not found')
          }
      } catch (error) {
          console.error(error);
      }
    };

    if (!isAppUpdateChecked && appConfig?.notify_updates) {
      checkForUpdates();
    }

    if (!isExtensionUpdateChecked && appConfig?.notify_updates) {
      checkForExtensionUpdates();
    }
  }, [appConfig])

  return (
    <ThemeProvider defaultTheme={appConfig?.theme || "system"} storageKey="vite-ui-theme">
      <TooltipProvider delayDuration={1000}>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;

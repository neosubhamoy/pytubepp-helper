import React from "react"
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ThemeProvider } from "@/components/theme-provider";
import { Config, WebSocketMessage } from "@/types";
import { sendStreamInfo } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { check as checkAppUpdate } from "@tauri-apps/plugin-updater";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

function App({ children }: { children: React.ReactNode }) {
  const appWindow = getCurrentWebviewWindow()
  const [appConfig, setAppConfig] = useState<Config | null>(null);
  const [isAppUpdateChecked, setIsAppUpdateChecked] = useState(false);

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

    if (!isAppUpdateChecked) {
      checkForUpdates();
    }
  }, [])

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

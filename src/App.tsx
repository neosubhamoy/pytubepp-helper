import { useState, useEffect } from "react";
import "./index.css";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { InstalledPrograms, WebSocketMessage, } from "./types";
import { extract_version, is_installed, sendStreamInfo } from "./lib/utils";

function App() {
  useEffect(() => {
    const handleCloseRequested = (event: any) => {
      event.preventDefault();
      appWindow.hide();
    };

    appWindow.onCloseRequested(handleCloseRequested);
  }, []);
  
  const [installedPrograms, setInstalledPrograms] = useState<InstalledPrograms>({
    python: {
      installed: false,
      version: null,
    },
    ffmpeg: {
      installed: false,
      version: null,
    },
    pytubefix: {
      installed: false,
      version: null,
    },
    pytubepp: {
      installed: false,
      version: null,
    },
  });

  useEffect(() => {
    const unlisten = listen<WebSocketMessage>('websocket-message', (event) => {
      if(event.payload.command === 'send-stream-info') {
        sendStreamInfo(event.payload.url);
      } else if(event.payload.command === 'download-stream') {
        const startDownload = async () => {
          try {
            await invoke('download_stream',  { url: event.payload.url, stream: event.payload.argument });
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

  function check_all_programs() {
    is_installed('python', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        python: {
          installed: result.installed,
          version: result.output ? extract_version(result.output) : null,
        }
      }));
    });
    is_installed('ffmpeg', '-version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        ffmpeg: {
          installed: result.installed,
          version: result.output ? extract_version(result.output) : null,
        }
      }));
    });
    is_installed('pytubefix', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        pytubefix: {
          installed: result.installed,
          version: result.output ? extract_version(result.output) : null,
        }
      }));
    });
    is_installed('pytubepp', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        pytubepp: {
          installed: result.installed,
          version: result.output ? extract_version(result.output) : null,
        }
      }));
    });
  }

  useEffect(() => {
    check_all_programs();
  }
  , []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="container">
        <div className="topbar flex justify-between items-center mt-5">
          <h1 className="text-xl font-bold">PytubePP Helper</h1>
          <Button size="sm" onClick={check_all_programs}>Re-Check</Button>
        </div>
        <div className="programstats mt-5">
          <p><b>Python:</b> {installedPrograms.python.installed ? 'installed' : 'not installed'} {installedPrograms.python.version ? `(${installedPrograms.python.version})` : ''}</p>
          <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
          <p><b>pytubefix:</b> {installedPrograms.pytubefix.installed ? 'installed' : 'not installed'} {installedPrograms.pytubefix.version ? `(${installedPrograms.pytubefix.version})` : ''}</p>
          <p><b>pytubepp:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

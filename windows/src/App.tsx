import { useState, useEffect } from "react";
import "./index.css";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InstalledPrograms, WebSocketMessage, } from "./types";
import { compareVersions, extractVersion, isInstalled, sendStreamInfo } from "./lib/utils";
import { CircleCheck, TriangleAlert, CircleAlert } from 'lucide-react';

function App() {
  useEffect(() => {
    const handleCloseRequested = (event: any) => {
      event.preventDefault();
      appWindow.hide();
    };

    appWindow.onCloseRequested(handleCloseRequested);
  }, []);
  
  const [installedPrograms, setInstalledPrograms] = useState<InstalledPrograms>({
    winget: {
      installed: false,
      version: null,
    },
    python: {
      installed: false,
      version: null,
    },
    pip: {
      installed: false,
      version: null,
    },
    ffmpeg: {
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

  function checkAllPrograms() {
    isInstalled('winget', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        winget: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
    isInstalled('python', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        python: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
    isInstalled('pip', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        pip: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
    isInstalled('ffmpeg', '-version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        ffmpeg: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
    isInstalled('pytubepp', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        pytubepp: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
  }

  useEffect(() => {
    checkAllPrograms();
  }
  , []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="container">
        <div className="topbar flex justify-between items-center mt-5">
          <h1 className="text-xl font-bold">PytubePP Helper</h1>
          <Button size="sm" onClick={checkAllPrograms}>Refresh</Button>
        </div>
        <div className="programstats mt-5">
          <div className="programitem flex items-center justify-between">
            <p><b>Python:</b> {installedPrograms.python.installed ? 'installed' : 'not installed'} {installedPrograms.python.version ? `(${installedPrograms.python.version})` : ''}</p>
            {installedPrograms.python.installed ? installedPrograms.python.version ? compareVersions(installedPrograms.python.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.winget.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {installer: 'winget', program: 'Python.Python.3.11'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
            {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.winget.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {installer: 'winget', program: 'ffmpeg'})}}>install</Button> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
            {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {installer: 'pip', program: 'pytubepp'})}}>install</Button> : null}
          </div>
          {(!installedPrograms.winget.installed && (!installedPrograms.python.installed || !installedPrograms.ffmpeg.installed)) ?
            <Alert className="mt-5" variant="destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>WinGet Not Found</AlertTitle>
              <AlertDescription>
                WinGet is required to install necessary packages. Please install it manually from <a className="underline" href="https://learn.microsoft.com/en-us/windows/package-manager/winget/#install-winget" target="_blank">here</a>. 
              </AlertDescription>
            </Alert>
          : null}
          {(installedPrograms.python.installed && installedPrograms.ffmpeg.installed && installedPrograms.pytubepp.installed) ?
            <Alert className="mt-5">
              <CircleCheck className="h-5 w-5" />
              <AlertTitle>Ready</AlertTitle>
              <AlertDescription>
                Everything looks ok! You can close this window now. Make sure it's always running in the background.
              </AlertDescription>
            </Alert>
          : null}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

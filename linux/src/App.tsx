import { useState, useEffect } from "react";
import "./index.css";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InstalledPrograms, WebSocketMessage, } from "./types";
import { compareVersions, extractVersion, isInstalled, sendStreamInfo, extractDistroId, detectDistro, detectDistroBase } from "./lib/utils";
import { CircleCheck, TriangleAlert, CircleAlert } from 'lucide-react';

function App() {
  useEffect(() => {
    const handleCloseRequested = (event: any) => {
      event.preventDefault();
      appWindow.hide();
    };

    appWindow.onCloseRequested(handleCloseRequested);
  }, []);

  const [distroId, setDistroId] = useState<string | null>(null)
  const [distroBase, setDistroBase] = useState<string | null>(null)
  const [installedPrograms, setInstalledPrograms] = useState<InstalledPrograms>({
    apt: {
      installed: false,
      version: null,
    },
    dnf: {
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
    isInstalled('apt', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        apt: {
          installed: result.installed,
          version: result.output ? extractVersion(result.output) : null,
        }
      }));
    });
    isInstalled('dnf', '--version').then((result) => {
      setInstalledPrograms((prevState) => ({
        ...prevState,
        dnf: {
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
    detectDistro().then((result) => {
      if(result) {
        setDistroId(extractDistroId(result))
        setDistroBase(detectDistroBase(extractDistroId(result)))
      }
    })
  }
  , []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="container">
        <div className="topbar flex justify-between items-center mt-5 mx-3">
          <h1 className="text-xl font-bold">PytubePP Helper</h1>
          <Button size="sm" onClick={checkAllPrograms}>Refresh</Button>
        </div>
        { distroId && distroBase && distroBase === 'debian' ?
        <div className="programstats mt-5 mx-3">
          <div className="programitem flex items-center justify-between">
            <p><b>Python:</b> {installedPrograms.python.installed ? 'installed' : 'not installed'} {installedPrograms.python.version ? `(${installedPrograms.python.version})` : ''}</p>
            {installedPrograms.python.installed ? installedPrograms.python.version ? compareVersions(installedPrograms.python.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.apt.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install Python3.12 -y'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
            {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.apt.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install ffmpeg -y'})}}>install</Button> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
            {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip install pytubepp --break-system-packages'})}}>install</Button> : null}
          </div>
          {(!installedPrograms.apt.installed && (!installedPrograms.python.installed || !installedPrograms.ffmpeg.installed)) ?
            <Alert className="mt-5" variant="destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>APT Not Found</AlertTitle>
              <AlertDescription>
                APT is required to install necessary debian packages. Please install it manually for your distro.
              </AlertDescription>
            </Alert>
          : null}
          {(!installedPrograms.pip.installed && !installedPrograms.pytubepp.installed) ?
            <Alert className="mt-5" variant="destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>PIP Not Found</AlertTitle>
              <AlertDescription>
                PIP is required to install necessary python packages. Please install it now to continue: <Button variant="link" className="text-blue-600 p-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install python3-pip -y'})}}>install</Button>
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
        : distroId && distroBase && distroBase === 'rhel' ?
        <div className="programstats mt-5 mx-3">
          <div className="programitem flex items-center justify-between">
            <p><b>Python:</b> {installedPrograms.python.installed ? 'installed' : 'not installed'} {installedPrograms.python.version ? `(${installedPrograms.python.version})` : ''}</p>
            {installedPrograms.python.installed ? installedPrograms.python.version ? compareVersions(installedPrograms.python.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.dnf.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install python3.12 -y'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
            {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.dnf.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install ffmpeg-free -y'})}}>install</Button> : null}
          </div>
          <div className="programitem flex items-center justify-between">
            <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
            {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip install pytubepp'})}}>install</Button> : null}
          </div>
          {(!installedPrograms.dnf.installed && (!installedPrograms.python.installed || !installedPrograms.ffmpeg.installed)) ?
            <Alert className="mt-5" variant="destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>DNF Not Found</AlertTitle>
              <AlertDescription>
                DNF is required to install necessary debian packages. Please install it manually for your distro.
              </AlertDescription>
            </Alert>
          : null}
          {(!installedPrograms.pip.installed && !installedPrograms.pytubepp.installed) ?
            <Alert className="mt-5" variant="destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>PIP Not Found</AlertTitle>
              <AlertDescription>
                PIP is required to install necessary python packages. Please install it now to continue: <Button variant="link" className="text-blue-600 p-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install python3-pip -y'})}}>install</Button>
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
        :
        <div className="programstats mt-5 mx-3">
          <Alert className="mt-5" variant="destructive">
            <CircleAlert className="h-5 w-5" />
            <AlertTitle>Unsupported Distro</AlertTitle>
            <AlertDescription>
              Sorry, your linux distro is currently not supported. If you think this is just a mistake or you want to request us to add support for your distro you can create a github issue <a className="underline" href="https://github.com/neosubhamoy/pytubepp-helper/issues" target="_blank">here</a>.
            </AlertDescription>
          </Alert>
        </div>
        }
      </div>
    </ThemeProvider>
  );
}

export default App;

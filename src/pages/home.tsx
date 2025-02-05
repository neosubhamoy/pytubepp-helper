import clsx from "clsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InstalledPrograms } from "@/types";
import { compareVersions, extractVersion, isInstalled, registerMacFiles } from "@/lib/utils";
import { CircleCheck, TriangleAlert, CircleAlert, Settings, RefreshCcw, Loader2, PackagePlus } from "lucide-react";
import { getPlatformInfo } from "@/lib/platform-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isWindows, setIsWindows] = useState<boolean>(false)
    const [windowsVersion, setWindowsVersion] = useState<string | null>(null)
    const [isMacOs, setIsMacOs] = useState<boolean>(false)
    const [macOsVersion, setMacOsVersion] = useState<string | null>(null)
    const [distroId, setDistroId] = useState<string | null>(null)
    const [distroPkgMngr, setDistroPkgMngr] = useState<string | null>(null)
    const [installedPrograms, setInstalledPrograms] = useState<InstalledPrograms>({
        winget: {
            installed: false,
            version: null,
        },
        apt: {
            installed: false,
            version: null,
        },
        dnf: {
            installed: false,
            version: null,
        },
        brew: {
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
        python3: {
            installed: false,
            version: null,
        },
        pip3: {
            installed: false,
            version: null,
        },
        ffmpeg: {
            installed: false,
            version: null,
        },
        nodejs: {
            installed: false,
            version: null,
        },
        pytubepp: {
            installed: false,
            version: null,
        },
    });

    function checkAllPrograms() {
        return Promise.all([
            isInstalled('winget', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                winget: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('apt', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                apt: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('dnf', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                dnf: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('homebrew', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                brew: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('python', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                python: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('pip', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                pip: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('python3', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                python3: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('pip3', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                pip3: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('ffmpeg', '-version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                ffmpeg: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('nodejs', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                nodejs: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            }),
            isInstalled('pytubepp', '--version').then((result) => {
                setInstalledPrograms((prevState) => ({
                ...prevState,
                pytubepp: {
                    installed: result.installed,
                    version: result.output ? extractVersion(result.output) : null,
                }
                }));
            })
        ]);
    }

    const fetchPlatformInfo = async () => {
        const info = await getPlatformInfo();
        setIsWindows(info.isWindows);
        setWindowsVersion(info.windowsVersion);
        setIsMacOs(info.isMacOs);
        setMacOsVersion(info.macOsVersion);
        setDistroId(info.distroId);
        setDistroPkgMngr(info.distroPkgMngr);
    };

    useEffect(() => {
        const init = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    checkAllPrograms(),
                    fetchPlatformInfo()
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        
        init();
    }, []);

    return (
        <div className="container">
            <div className={clsx("topbar flex justify-between items-center mt-5", !isWindows && "mx-3")}>
                <h1 className="text-xl font-bold">PytubePP Helper</h1>
                <div className="flex items-center">
                    <Tooltip>
                        <TooltipTrigger>
                            <Button variant="outline" size="icon" asChild>
                                <Link to="/settings">
                                    <Settings className="w-5 h-5"/>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>settings</p></TooltipContent>
                    </Tooltip>
                    { isMacOs && macOsVersion && compareVersions(macOsVersion, '10.13') > 0 ?
                    <Tooltip>
                        <TooltipTrigger>
                            <Button className="ml-3" size="icon" onClick={async () => {
                                const result = await registerMacFiles();
                                toast({ title: result.message, variant: result.success ? 'default' : 'destructive' });
                            }}>
                                <PackagePlus className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>register to mac</p></TooltipContent>
                    </Tooltip>
                    :
                    null
                    }
                    <Tooltip>
                        <TooltipTrigger>
                            <Button className="ml-3" size="icon" disabled={isLoading} onClick={checkAllPrograms}>
                                <RefreshCcw className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>refresh</p></TooltipContent>
                    </Tooltip>
                </div>
            </div>
            { isLoading ?
            <div className="mt-5 mx-3">
                <div className="flex flex-col">
                    <div className="flex items-center justify-center py-[4.3rem]">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin"/>
                            <p className="ml-3 mt-2 text-muted-foreground">checking...</p>
                        </div>
                    </div>
                </div>
            </div>
            : distroId && distroPkgMngr && distroPkgMngr === 'apt' ? /* Section for Debian */
            <div className="programstats mt-5 mx-3">
                <div className="programitem flex items-center justify-between">
                    <p><b>Python:</b> {installedPrograms.python3.installed ? 'installed' : 'not installed'} {installedPrograms.python3.version ? `(${installedPrograms.python3.version})` : ''}</p>
                    {installedPrograms.python3.installed ? installedPrograms.python3.version ? compareVersions(installedPrograms.python3.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.apt.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install python3 -y'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
                    {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.apt.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install ffmpeg -y'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>Node.js:</b> {installedPrograms.nodejs.installed ? 'installed' : 'not installed'} {installedPrograms.nodejs.version ? `(${installedPrograms.nodejs.version})` : ''}</p>
                    {installedPrograms.nodejs.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.apt.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install nodejs -y'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
                    {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip3.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip3 install pytubepp --break-system-packages'})}}>install</Button> : null}
                </div>
                {(!installedPrograms.apt.installed && (!installedPrograms.python3.installed || !installedPrograms.ffmpeg.installed)) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>APT Not Found</AlertTitle>
                    <AlertDescription>
                        APT is required to install necessary debian packages. Please install it manually for your distro.
                    </AlertDescription>
                    </Alert>
                : null}
                {(!installedPrograms.pip3.installed && !installedPrograms.pytubepp.installed) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>PIP Not Found</AlertTitle>
                    <AlertDescription>
                        PIP is required to install necessary python packages. Please install it now to continue: <Button variant="link" className="text-blue-600 p-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo apt install python3-pip -y'})}}>install</Button>
                    </AlertDescription>
                    </Alert>
                : null}
                {(installedPrograms.python3.installed && installedPrograms.ffmpeg.installed && installedPrograms.pytubepp.installed) ?
                    <Alert className="mt-5">
                    <CircleCheck className="h-5 w-5" />
                    <AlertTitle>Ready</AlertTitle>
                    <AlertDescription>
                        Everything looks ok! You can close this window now. Make sure it's always running in the background.
                    </AlertDescription>
                    </Alert>
                : null}
            </div>
            : distroId && distroPkgMngr && distroPkgMngr === 'dnf' ? /* Section for RHEL */
            <div className="programstats mt-5 mx-3">
                <div className="programitem flex items-center justify-between">
                    <p><b>Python:</b> {installedPrograms.python3.installed ? 'installed' : 'not installed'} {installedPrograms.python3.version ? `(${installedPrograms.python3.version})` : ''}</p>
                    {installedPrograms.python3.installed ? installedPrograms.python3.version ? compareVersions(installedPrograms.python3.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.dnf.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install python3 -y'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
                    {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.dnf.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install ffmpeg -y'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>Node.js:</b> {installedPrograms.nodejs.installed ? 'installed' : 'not installed'} {installedPrograms.nodejs.version ? `(${installedPrograms.nodejs.version})` : ''}</p>
                    {installedPrograms.nodejs.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.dnf.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install nodejs -y'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
                    {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip3.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip3 install pytubepp'})}}>install</Button> : null}
                </div>
                {(!installedPrograms.dnf.installed && (!installedPrograms.python3.installed || !installedPrograms.ffmpeg.installed)) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>DNF Not Found</AlertTitle>
                    <AlertDescription>
                        DNF is required to install necessary rpm packages. Please install it manually for your distro.
                    </AlertDescription>
                    </Alert>
                : null}
                {(!installedPrograms.pip3.installed && !installedPrograms.pytubepp.installed) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>PIP Not Found</AlertTitle>
                    <AlertDescription>
                        PIP is required to install necessary python packages. Please install it now to continue: <Button variant="link" className="text-blue-600 p-0" onClick={async () => { await invoke('install_program', {icommand: 'sudo dnf install python3-pip -y'})}}>install</Button>
                    </AlertDescription>
                    </Alert>
                : null}
                {(installedPrograms.python3.installed && installedPrograms.ffmpeg.installed && installedPrograms.pytubepp.installed) ?
                    <Alert className="mt-5">
                    <CircleCheck className="h-5 w-5" />
                    <AlertTitle>Ready</AlertTitle>
                    <AlertDescription>
                        Everything looks ok! You can close this window now. Make sure it's always running in the background.
                    </AlertDescription>
                    </Alert>
                : null}
            </div>
            : isWindows && windowsVersion && parseInt(windowsVersion) >= 17134 ? /* Section for Windows */
            <div className="programstats mt-5">
                <div className="programitem flex items-center justify-between">
                    <p><b>Python:</b> {installedPrograms.python.installed ? 'installed' : 'not installed'} {installedPrograms.python.version ? `(${installedPrograms.python.version})` : ''}</p>
                    {installedPrograms.python.installed ? installedPrograms.python.version ? compareVersions(installedPrograms.python.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.winget.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'winget install Python.Python.3.12'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
                    {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.winget.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'winget install ffmpeg'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>Node.js:</b> {installedPrograms.nodejs.installed ? 'installed' : 'not installed'} {installedPrograms.nodejs.version ? `(${installedPrograms.nodejs.version})` : ''}</p>
                    {installedPrograms.nodejs.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.winget.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'winget install OpenJS.NodeJS.LTS'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
                    {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip install pytubepp'})}}>install</Button> : null}
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
            : isMacOs && macOsVersion && compareVersions(macOsVersion, '10.13') > 0 ? /* Section for macOS */
            <div className="programstats mt-5 mx-3">
                <div className="programitem flex items-center justify-between">
                    <p><b>Python:</b> {installedPrograms.python3.installed ? 'installed' : 'not installed'} {installedPrograms.python3.version ? `(${installedPrograms.python3.version})` : ''}</p>
                    {installedPrograms.python3.installed ? installedPrograms.python3.version ? compareVersions(installedPrograms.python3.version, '3.8') < 0 ? <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.brew.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'brew install python'})}}>install</Button> : <TriangleAlert className="w-5 h-5 my-2 text-orange-400"/> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>FFmpeg:</b> {installedPrograms.ffmpeg.installed ? 'installed' : 'not installed'} {installedPrograms.ffmpeg.version ? `(${installedPrograms.ffmpeg.version})` : ''}</p>
                    {installedPrograms.ffmpeg.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.brew.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'brew install ffmpeg'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>Node.js:</b> {installedPrograms.nodejs.installed ? 'installed' : 'not installed'} {installedPrograms.nodejs.version ? `(${installedPrograms.nodejs.version})` : ''}</p>
                    {installedPrograms.nodejs.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.brew.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'brew install node'})}}>install</Button> : null}
                </div>
                <div className="programitem flex items-center justify-between">
                    <p><b>PytubePP:</b> {installedPrograms.pytubepp.installed ? 'installed' : 'not installed'} {installedPrograms.pytubepp.version ? `(${installedPrograms.pytubepp.version})` : ''}</p>
                    {installedPrograms.pytubepp.installed ? <CircleCheck className="w-5 h-5 my-2 text-green-400"/> : installedPrograms.pip3.installed ? <Button variant="link" className="text-blue-600 px-0" onClick={async () => { await invoke('install_program', {icommand: 'pip3 install pytubepp --break-system-packages'})}}>install</Button> : null}
                </div>
                {(!installedPrograms.brew.installed && (!installedPrograms.python3.installed || !installedPrograms.ffmpeg.installed)) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>Homebrew Not Found</AlertTitle>
                    <AlertDescription>
                    Homebrew is required to install necessary unix packages. Please install it manually for your mac.
                    </AlertDescription>
                    </Alert>
                : null}
                {(!installedPrograms.pip3.installed && !installedPrograms.pytubepp.installed) ?
                    <Alert className="mt-5" variant="destructive">
                    <CircleAlert className="h-5 w-5" />
                    <AlertTitle>PIP Not Found</AlertTitle>
                    <AlertDescription>
                        PIP is required to install necessary python packages. Please install it now to continue: <Button variant="link" className="text-blue-600 p-0" onClick={async () => { await invoke('install_program', {icommand: 'brew install python3-pip -y'})}}>install</Button>
                    </AlertDescription>
                    </Alert>
                : null}
                {(installedPrograms.python3.installed && installedPrograms.ffmpeg.installed && installedPrograms.nodejs.installed && installedPrograms.pytubepp.installed) ?
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
                <AlertTitle>Unsupported OS</AlertTitle>
                <AlertDescription>
                Sorry, your os/distro is currently not supported. If you think this is just a mistake or you want to request us to add support for your os/distro you can create a github issue <a className="underline" href="https://github.com/neosubhamoy/pytubepp-helper/issues" target="_blank">here</a>.
                </AlertDescription>
            </Alert>
            </div>
            }
        </div>
    );
}

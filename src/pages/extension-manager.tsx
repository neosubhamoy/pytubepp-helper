import clsx from "clsx";
import * as fs from "@tauri-apps/plugin-fs"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatformInfo } from "@/lib/platform-utils";
import { CurrentExtension, LatestExtensionResponse, PlatformInfo } from "@/types";
import { ArrowLeft, ChevronsUpDown, CircleHelp, Loader2, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { downloadDir, tempDir, join } from "@tauri-apps/api/path";
import { compareVersions } from "@/lib/utils";
import { fetch } from '@tauri-apps/plugin-http';
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { download } from '@tauri-apps/plugin-upload';
import { Command } from "@tauri-apps/plugin-shell";
import { toast } from "sonner"
import chromeLogo from "@/assets/images/chrome.png"
import firefoxLogo from "@/assets/images/firefox.png"
import edgeLogo from "@/assets/images/edge.png"
import operaLogo from "@/assets/images/opera.png"
import pytubeppLogo from "@/assets/images/pytubepp.png"

export default function ExtensionManagerPage() {
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCollapsibleOpen, setCollapsibleIsOpen] = useState(false)
    const [isAccordionOpen, setAccordionIsOpen] = useState(false)
    const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
    const [isExtensionUpdateAvailable, setIsExtensionUpdateAvailable] = useState(false);
    const [extensionUpdate, setExtensionUpdate] = useState<LatestExtensionResponse | null>(null)
    const [currentExtension, setCurrentExtension] = useState<CurrentExtension | null>(null)
    const [updateStatus, setUpdateStatus] = useState<string | null>(null)

    async function checkForUpdates() {
        setIsLoading(true);
        try {
            const downloadDirPath = await downloadDir()
            const extensionManifestPath = await join(downloadDirPath, "pytubepp-extension-chrome", "manifest.json")
            const extensionManifestExists = await fs.exists(extensionManifestPath)
            const response = await fetch('https://github.com/neosubhamoy/pytubepp-extension/releases/latest/download/latest.json', {
                method: 'GET',
            });
            if (response.ok) {
                const data: LatestExtensionResponse = await response.json()
                setExtensionUpdate(data)
                if (extensionManifestExists) {
                    setIsExtensionInstalled(true)
                    const currentManifest = JSON.parse(await fs.readTextFile(extensionManifestPath))
                    setCurrentExtension(currentManifest)
                    setIsExtensionUpdateAvailable(compareVersions(data.version, currentManifest.version) === 1)
                } else {
                    setIsExtensionInstalled(false)
                    setCurrentExtension(null)
                    setIsExtensionUpdateAvailable(false)
                }
            }
            else {
                setIsExtensionUpdateAvailable(false)
                setExtensionUpdate(null)
                if (extensionManifestExists) {
                    setIsExtensionInstalled(true)
                    const currentManifest = JSON.parse(await fs.readTextFile(extensionManifestPath))
                    setCurrentExtension(currentManifest)
                } else {
                    setIsExtensionInstalled(false)
                    setCurrentExtension(null)
                }
                console.error('Failed to fetch latest extension version');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const unpackExtension = async (extension: LatestExtensionResponse, operation: "unpack" | "update") => {
        setIsUpdating(true)
        try {
            setUpdateStatus('Preparing')
            const downloadDirPath = await downloadDir()
            const tempDirPath = await tempDir()
            const extensionDirPath = await join(downloadDirPath, "pytubepp-extension-chrome")
            const appTempDirPath = await join(tempDirPath, "com.neosubhamoy.pytubepp.helper")
            const tempExtensionDownloadPath = await join(appTempDirPath, `pytubepp-extension-chrome-v${extension.version}.zip`)

            const extensionDirExists = await fs.exists(extensionDirPath)
            const appTempDirExists = await fs.exists(appTempDirPath)

            if (!extensionDirExists) await fs.mkdir(extensionDirPath, { recursive: true}).then(() => console.log(`Created: ${extensionDirPath}`))
            if (!appTempDirExists) await fs.mkdir(appTempDirPath, { recursive: true}).then(() => console.log(`Created: ${appTempDirPath}`))
            
            setUpdateStatus('Downloading')
            await download(
                extension.browsers.chrome.url,
                tempExtensionDownloadPath,
                ({ progress, total }) => console.log(`Downloading: ${progress} of ${total} bytes`)
            );

            setUpdateStatus('Unpacking')
            const output = await Command.sidecar('binaries/7zip', ['x', tempExtensionDownloadPath, `-o${extensionDirPath}`, '-aoa']).execute()
            if (output.code === 0) {
                console.log(output.stdout)
                console.log(`Unpacked ${tempExtensionDownloadPath} to ${extensionDirPath}`)
            } else {
                console.log(output.stdout, output.stderr)
            }

            setUpdateStatus('Cleaning')
            await fs.remove(tempExtensionDownloadPath)
            console.log(`Deleted: ${tempExtensionDownloadPath}`)

            setIsExtensionInstalled(true)
            setCurrentExtension({version: extension.version})
            setIsExtensionUpdateAvailable(false)

            if (operation === "unpack") toast(`Successfully unpacked v${extension.version} to ${extensionDirPath}`)
            if (operation === "update") toast(`Successfully updated to v${extension.version}. Please reload the extension to reflect changes`)
        } catch (error) {
            if (operation === "unpack") toast(`Failed to unpack v${extension.version}`)
            if (operation === "update") toast(`Failed to update v${extension.version}`)
            console.error(error);
        } finally {
            setIsUpdating(false);
            setUpdateStatus(null)
        }
    }

    useEffect(() => {
        getPlatformInfo().then(setPlatformInfo).catch(console.error);
        checkForUpdates();
    }, [])

    return (
        <div className="container">
            <div className={clsx("topbar flex justify-between items-center mt-5", !platformInfo?.isWindows && "mx-3")}>
                <div className="flex items-center">
                    <Link to="/" className={clsx(isUpdating && "pointer-events-none opacity-50")}>
                        <ArrowLeft className="w-5 h-5 mr-3"/>
                    </Link>
                    <h1 className="text-xl font-bold">Extension Manager</h1>
                </div>
                <div className="flex items-center">
                    <Tooltip>
                        <TooltipTrigger>
                            <Button className="ml-3" size="icon" disabled={isLoading || isUpdating} onClick={checkForUpdates}>
                                <RefreshCcw className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>refresh</p></TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className={clsx("mt-5", !platformInfo?.isWindows && "mx-3")}>
                {
                    isLoading ? (
                    <div className="mt-5 mx-3">
                        <div className="flex flex-col min-h-[55vh]">
                            <div className="flex items-center justify-center py-[4.3rem]">
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin"/>
                                    <p className="ml-3 mt-2 text-muted-foreground">ckecking...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ) : (
                    <div className="mt-5">
                        <div className="flex flex-col min-h-[55vh] max-h-[75vh] overflow-y-scroll">
                            <Card className="p-2 mb-3 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="imgwrapper h-12 w-12 relative">
                                            <img src={chromeLogo} alt="chrome" />
                                            <img className="absolute bottom-0 right-0 h-5 w-5" src={pytubeppLogo} alt="pytubepp" />
                                        </div>
                                        <div className="flex flex-col ml-3">
                                            <h3>PytubePP Extension (Chrome)</h3>
                                            <p className="text-xs text-muted-foreground">Unpacked: { currentExtension ? currentExtension.version : 'none' } &nbsp; Latest: { extensionUpdate ? extensionUpdate.version : 'unknown' }</p>
                                        </div>
                                    </div>
                                    <Button className="mr-2" size="sm" onClick={isExtensionUpdateAvailable && extensionUpdate ? () => unpackExtension(extensionUpdate, "update") : isExtensionInstalled ? () => {console.log('Already latest version')} : extensionUpdate ? () => unpackExtension(extensionUpdate, "unpack") : () => {console.error('Download url not available')}} disabled={(!isExtensionUpdateAvailable && isExtensionInstalled) || isUpdating}>{isUpdating ? <><Loader2 className="w-4 h-4 animate-spin"/> {updateStatus}</> : isExtensionUpdateAvailable ? 'Update' : isExtensionInstalled ? 'Unpacked' : 'Unpack'}</Button>
                                </div>
                                <div className="px-2 mt-2">
                                    <Collapsible
                                    open={isCollapsibleOpen}
                                    onOpenChange={setCollapsibleIsOpen}
                                    className="w-full space-y-2"
                                    >
                                        <div className="flex items-center justify-between space-x-4">
                                            <h4 className="text-sm flex items-center">
                                                <CircleHelp className="w-3 h-3 mr-2"/> How to use unpacked extension
                                            </h4>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <ChevronsUpDown className="h-4 w-4" />
                                                    <span className="sr-only">Toggle</span>
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                        <CollapsibleContent className="">
                                        <ul className="text-xs text-muted-foreground">
                                            <li>1. Clicking on the 'Unpack' button unpacks latest pytubepp-extension for chrome within '~/Downloads/pytubepp-extension-chrome' folder</li>
                                            <li>2. You need to manually <a className="underline" href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked" target="_blank">load the unpacked extension folder</a> by visiting 'chrome://extensions' page</li>
                                            <li>3. If an update is available the 'Update' button will show up, Simply click on the button to update and don't forget to <a className="underline" href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#reload" target="_blank">reload the extension</a> by visiting 'chrome://extensions' page after updating</li>
                                        </ul>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </Card>
                            <Accordion type="single" collapsible className="overflow-x-hidden" onValueChange={() => setAccordionIsOpen(!isAccordionOpen)}>
                                <AccordionItem value="store-listings">
                                    <AccordionTrigger>Official Store Listings (Auto-Updates)</AccordionTrigger>
                                    <AccordionContent>
                                        <Card className="p-2 mb-3 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="imgwrapper h-12 w-12 flex justify-center items-center">
                                                    <img className="h-10" src={firefoxLogo} alt="firefox" />
                                                </div>
                                                <div className="flex flex-col ml-3">
                                                    <h3>PytubePP Addon (Firefox)</h3>
                                                    <p className="text-xs text-muted-foreground">Add pytubepp-addon to firefox</p>
                                                </div>
                                            </div>
                                            <Button className="mr-2" size="sm" asChild>
                                                <a href="https://addons.mozilla.org/en-US/firefox/addon/pytubepp-addon/" target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </Card>
                                        <Card className="p-2 mb-3 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="imgwrapper h-12 w-12 flex justify-center items-center">
                                                    <img className="h-10 w-10" src={edgeLogo} alt="edge" />
                                                </div>
                                                <div className="flex flex-col ml-3">
                                                    <h3>PytubePP Extension (Edge)</h3>
                                                    <p className="text-xs text-muted-foreground">Add pytubepp-extension to edge</p>
                                                </div>
                                            </div>
                                            <Button className="mr-2" size="sm" asChild>
                                                <a href="https://microsoftedge.microsoft.com/addons/detail/pytubepp-extension-foss/ebneapoekcjelholncnlpdohjbjabhbi" target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </Card>
                                        <Card className="p-2 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="imgwrapper h-12 w-12 flex justify-center items-center">
                                                    <img className="h-10 w-10" src={operaLogo} alt="opera" />
                                                </div>
                                                <div className="flex flex-col ml-3">
                                                    <h3>PytubePP Extension (Opera)</h3>
                                                    <p className="text-xs text-muted-foreground">Add pytubepp-extension to opera</p>
                                                </div>
                                            </div>
                                            <Button className="mr-2" size="sm" asChild>
                                                <a href="https://addons.opera.com/en/extensions/details/pytubepp-extension-foss/" target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            {
                                !isAccordionOpen && !isCollapsibleOpen && (
                                    <div className="mt-3">
                                        <ul className="text-xs text-muted-foreground">
                                            <li>* Extension Manager helps you manage unpacked pytubepp-extension (installing and updating) as pytubepp-extension is not available on Chrome Web Store under <a href="https://developer.chrome.com/docs/webstore/troubleshooting/#prohibited-products" target="_blank" className="underline">Blue Zinc</a> guidelines. (unpacked chrome extension works for all chromium based browsers)</li>
                                        </ul>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    )
                }
            </div>
        </div>
    )
}
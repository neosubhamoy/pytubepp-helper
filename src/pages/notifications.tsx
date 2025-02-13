import clsx from "clsx";
import { useState, useEffect } from "react";
import { getPlatformInfo } from "@/lib/platform-utils";
import { PlatformInfo } from "@/types";
import { ArrowLeft, Download, Loader2, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { check as checkAppUpdate, Update } from "@tauri-apps/plugin-updater";
import { relaunch as relaunchApp } from "@tauri-apps/plugin-process";
import { Progress } from "@/components/ui/progress";

export default function NotificationsPage() {
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [appUpdate, setAppUpdate] = useState<Update | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    async function checkForUpdates() {
        setIsLoading(true);
        try {
            const update = await checkAppUpdate();
            if (update) {
                setAppUpdate(update);
                console.log(`app update available v${update.version}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function downloadAndInstallUpdate(update: Update) {
        setIsUpdating(true);
        let downloaded = 0;
        let contentLength: number | undefined = 0;
        await update.downloadAndInstall((event) => {
            switch (event.event) {
            case 'Started':
                contentLength = event.data.contentLength;
                console.log(`started downloading ${event.data.contentLength} bytes`);
                break;
            case 'Progress':
                downloaded += event.data.chunkLength;
                setDownloadProgress(downloaded / (contentLength || 0));
                console.log(`downloaded ${downloaded} from ${contentLength}`);
                break;
            case 'Finished':
                console.log('download finished');
                setIsUpdating(false);
                break;
            }
        });
        await relaunchApp();
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
                    <h1 className="text-xl font-bold">Notifications</h1>
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
                    ) : appUpdate ? (
                    <div className="mt-5">
                        <div className="flex flex-col min-h-[55vh]">
                            <Card className="">
                                <CardHeader>
                                    <CardTitle>PytubePP Helper v{appUpdate.version} - Update Available</CardTitle>
                                    <CardDescription>A newer version of PytubePP Helper is available. Please update to the latest version to get the best experience!</CardDescription>
                                    {
                                        isUpdating && (
                                            <Progress value={downloadProgress * 100}/>
                                        )
                                    }
                                </CardHeader>
                                <CardFooter className="flex justify-between">
                                    <div>
                                        {
                                            isUpdating && (
                                                <div className="flex items-center">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                                    <p className="text-sm text-muted-foreground">Downloading...</p>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <div>
                                        <Button variant="link" size="sm" asChild>
                                            <a href="https://github.com/neosubhamoy/pytubepp-helper/releases/latest" target="_blank">✨ Changelog</a>
                                        </Button>
                                        <Button className="ml-3" size="sm" disabled={isUpdating} onClick={() => downloadAndInstallUpdate(appUpdate)}>
                                            <Download className="w-4 h-4 mr-2"/>
                                            Update
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                    ) : (
                    <div className="mt-5 mx-3">
                        <div className="flex flex-col min-h-[55vh]">
                            <div className="flex items-center justify-center py-[4.3rem]">
                                <div className="flex flex-col items-center justify-center">
                                    <p className="font-semibold ml-3 mt-2">No Notifications</p>
                                    <p className="text-sm ml-3 mt-1 text-muted-foreground">You are all caught up! for now 😉</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    )
                }
            </div>
        </div>
    )
}

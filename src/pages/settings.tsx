import clsx from "clsx";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Globe, History, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Config, PlatformInfo } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatformInfo } from "@/lib/platform-utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch";

const DEFAULT_PORT = 3030;
const DEFAULT_THEME = "system";
const DEFAULT_NOTIFY_UPDATES = true;
const settingsFormSchema = z.object({
    port: z.number().min(3000, { message: "Port must be greater than 3000" }).max(3999, { message: "Port must be less than 3999" }),
    theme: z.enum(["system", "dark", "light"], { message: "Invalid theme" }),
    notify_updates: z.boolean({ message: "Not a boolean value" }),
})

export default function SettingsPage() {
    const { setTheme } = useTheme();
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
    const [appConfig, setAppConfig] = useState<Config | null>(null);
    const [appVersion, setAppVersion] = useState<string | null>(null);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    
    const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            port: DEFAULT_PORT,
            theme: DEFAULT_THEME,
            notify_updates: DEFAULT_NOTIFY_UPDATES,
        },
    });

    useEffect(() => {
        const subscription = settingsForm.watch((value) => {
            if (appConfig) {
                setIsFormDirty(value.port !== appConfig.port || value.theme !== appConfig.theme || value.notify_updates !== appConfig.notify_updates);
            }
        });
        return () => subscription.unsubscribe();
    }, [settingsForm, appConfig]);

    useEffect(() => {
        const getConfig = async () => {
            const config: Config = await invoke("get_config");
            if (config) {
                setAppConfig(config);
                settingsForm.reset({ port: config.port, theme: config.theme, notify_updates: config.notify_updates });
            }
        }
        getConfig().catch(console.error);
    }, [settingsForm]);

    useEffect(() => {
        getPlatformInfo().then(setPlatformInfo).catch(console.error);
        const getAppVersion = async () => {
            const version = await getVersion();
            setAppVersion(version);
        }
        getAppVersion().catch(console.error);
    }, [])

    useEffect(() => {
        const updateTheme = async () => {
            setTheme(appConfig?.theme || DEFAULT_THEME);
        }
        updateTheme().catch(console.error);
    }, [appConfig?.theme]);

    const updateConfig = async () => {
        try {
            const updatedConfig: Config = await invoke("update_config", { 
                newConfig: { 
                    port: Number(settingsForm.getValues().port),
                    theme: settingsForm.getValues().theme,
                    notify_updates: settingsForm.getValues().notify_updates,
                } 
            });
            setAppConfig(updatedConfig);
            setIsFormDirty(false);
            toast("Settings updated");
        } catch (error) {
            console.error("Failed to update config:", error);
            toast("Failed to update settings");
        }
    }

    const resetConfig = async () => {
        try {
            const config: Config = await invoke("reset_config");
            setAppConfig(config);
            settingsForm.reset({ port: config.port, theme: config.theme, notify_updates: config.notify_updates });
            setIsFormDirty(false);
            toast("Settings reset to default");
        } catch (error) {
            console.error("Failed to reset config:", error);
            toast("Failed to reset settings");
        }
    }

    const isUsingDefaultConfig = appConfig?.port === DEFAULT_PORT && appConfig?.theme === DEFAULT_THEME && appConfig?.notify_updates === DEFAULT_NOTIFY_UPDATES;

    return (
        <div className="container">
            <div className={clsx("topbar flex justify-between items-center mt-5", !platformInfo?.isWindows && "mx-3")}>
                <div className="flex items-center">
                    <Link to="/">
                        <ArrowLeft className="w-5 h-5 mr-3"/>
                    </Link>
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>
                <div className="flex items-center">
                    <Tooltip>
                        <TooltipTrigger>
                            <Button 
                                className="ml-3" 
                                variant="outline" 
                                size="icon" 
                                onClick={() => resetConfig()}
                                disabled={isUsingDefaultConfig}
                            >
                                <History className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isUsingDefaultConfig ? "using default settings" : "reset to default"}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger>
                            <Button 
                                className="ml-3" 
                                size="icon" 
                                onClick={() => saveButtonRef.current?.click()}
                                disabled={!isFormDirty}
                            >
                                <Save className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isFormDirty ? "save changes" : "no changes to save"}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className={clsx("mt-5", !platformInfo?.isWindows && "mx-3")}>
                <div className="flex flex-col min-h-[55vh] max-h-[58vh] overflow-y-scroll">
                    <Form {...settingsForm}>
                        <form onSubmit={settingsForm.handleSubmit(updateConfig)}>
                            <FormField
                                control={settingsForm.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem className="mb-2">
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="focus-visible:ring-0"
                                                type="text" 
                                                {...field} 
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value ? Number(value) : DEFAULT_PORT);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            The port to use for websocket communication with msghost
                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={settingsForm.control}
                                name="theme"
                                render={({ field }) => (
                                    <FormItem className="mb-2">
                                        <FormLabel>Theme</FormLabel>
                                        <FormControl>
                                            <Select {...field} onValueChange={(value) => field.onChange(value)}>
                                                <SelectTrigger className="w-full ring-0 focus:ring-0">
                                                    <SelectValue placeholder="Select App Theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="system">Follow System</SelectItem>
                                                        <SelectItem value="light">Light</SelectItem>
                                                        <SelectItem value="dark">Dark</SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>
                                            Choose app interface theme
                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={settingsForm.control}
                                name="notify_updates"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-4 mt-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Notify Updates</FormLabel>
                                            <FormDescription>
                                            Notify for app and component updates (Recommended)
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button className="hidden" ref={saveButtonRef} type="submit">Save</Button>
                        </form>
                    </Form>
                </div>
                <div className="flex justify-between items-center border-t border-muted-foreground/50 pt-2 relative">
                    <div className="tintbar absolute -top-[0.05rem] left-0 -translate-y-full w-full h-5 bg-gradient-to-b from-transparent to-background"></div>
                    <div className="flex flex-col">
                        <p>PytubePP Helper <span className="text-muted-foreground">|</span> <span className="text-sm text-muted-foreground">v{appVersion}-beta</span></p>
                        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} - <a href="https://github.com/neosubhamoy/pytubepp-helper/blob/main/LICENSE" target="_blank">MIT License</a> - Made with ❤️ by <a href="https://neosubhamoy.com" target="_blank">Subhamoy</a></p>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex justify-center items-center gap-2">
                            <a href="https://pytubepp.neosubhamoy.com" target="_blank" title="website">
                                <Globe className="w-4 h-4 text-muted-foreground"/>
                            </a>
                            <a href="https://github.com/neosubhamoy/pytubepp-helper" target="_blank" title="github">
                                <Github className="w-4 h-4 text-muted-foreground"/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

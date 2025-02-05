import clsx from "clsx";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Config, PlatformInfo } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatformInfo } from "@/lib/platform-utils";

const DEFAULT_PORT = 3030;
const settingsFormSchema = z.object({
    port: z.number().min(3000, { message: "Port must be greater than 3000" }).max(3999, { message: "Port must be less than 3999" }),
})

export default function SettingsPage() {
    const { toast } = useToast();
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
    const [appConfig, setAppConfig] = useState<Config | null>(null);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    
    const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            port: DEFAULT_PORT,
        },
    });

    useEffect(() => {
        const subscription = settingsForm.watch((value) => {
            if (appConfig) {
                setIsFormDirty(value.port !== appConfig.port);
            }
        });
        return () => subscription.unsubscribe();
    }, [settingsForm, appConfig]);

    useEffect(() => {
        const getConfig = async () => {
            const config: Config = await invoke("get_config");
            if (config) {
                setAppConfig(config);
                settingsForm.reset({ port: config.port });
            }
        }
        getConfig().catch(console.error);
    }, [settingsForm]);

    useEffect(() => {
        getPlatformInfo().then(setPlatformInfo).catch(console.error);
    }, [])

    const updateConfig = async () => {
        try {
            const updatedConfig: Config = await invoke("update_config", { 
                newConfig: { 
                    port: Number(settingsForm.getValues().port) 
                } 
            });
            setAppConfig(updatedConfig);
            setIsFormDirty(false);
            toast({
                title: "Settings updated"
            });
        } catch (error) {
            console.error("Failed to update config:", error);
            toast({
                title: "Failed to update settings",
                variant: "destructive"
            });
        }
    }

    const resetConfig = async () => {
        try {
            const config: Config = await invoke("reset_config");
            setAppConfig(config);
            settingsForm.reset({ port: config.port });
            setIsFormDirty(false);
            toast({
                title: "Using default settings"
            });
        } catch (error) {
            console.error("Failed to reset config:", error);
            toast({
                title: "Failed to reset settings",
                variant: "destructive"
            });
        }
    }

    const isUsingDefaultConfig = appConfig?.port === DEFAULT_PORT;

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
                <div className="flex flex-col">
                    <Form {...settingsForm}>
                        <form onSubmit={settingsForm.handleSubmit(updateConfig)}>
                            <FormField
                                control={settingsForm.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input 
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
                                            The port to use for the websocket server
                                        </FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <Button className="hidden" ref={saveButtonRef} type="submit">Save</Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}

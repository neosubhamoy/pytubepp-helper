import { platform } from "@tauri-apps/plugin-os";
import { detectDistro, detectMacOs, detectPackageManager, detectWindows, extractDistroId, extractPkgMngrName, extractVersion } from "@/lib/utils";
import { PlatformInfo } from "@/types";

export async function getPlatformInfo(): Promise<PlatformInfo> {
    const defaultInfo: PlatformInfo = {
        isWindows: false,
        windowsVersion: null,
        isMacOs: false,
        macOsVersion: null,
        distroId: null,
        distroPkgMngr: null,
    };

    try {
        const currentPlatform = await platform();

        switch (currentPlatform) {
            case 'windows': {
                const windowsResult = await detectWindows();
                if (windowsResult) {
                    return {
                        ...defaultInfo,
                        isWindows: true,
                        windowsVersion: extractVersion(windowsResult),
                    };
                }
                break;
            }
            case 'macos': {
                const macResult = await detectMacOs();
                if (macResult) {
                    return {
                        ...defaultInfo,
                        isMacOs: true,
                        macOsVersion: extractVersion(macResult),
                    };
                }
                break;
            }

            case 'linux': {
                const distroResult = await detectDistro();
                if (distroResult) {
                    const distroPkgMngrResult = await detectPackageManager();
                    return {
                        ...defaultInfo,
                        distroId: extractDistroId(distroResult),
                        distroPkgMngr: distroPkgMngrResult ? extractPkgMngrName(distroPkgMngrResult) : null,
                    };
                }
                break;
            }

            default:
                console.log('Unsupported platform');
        }
    } catch (error) {
        console.error('Error detecting platform:', error);
    }

    return defaultInfo;
}

// Individual getters for specific platforms
export async function isWindowsPlatform(): Promise<{ isWindows: boolean; version: string | null }> {
    const info = await getPlatformInfo();
    return { isWindows: info.isWindows, version: info.windowsVersion };
}

export async function isMacOsPlatform(): Promise<{ isMacOs: boolean; version: string | null }> {
    const info = await getPlatformInfo();
    return { isMacOs: info.isMacOs, version: info.macOsVersion };
}

export async function getLinuxInfo(): Promise<{ distroId: string | null; packageManager: string | null }> {
    const info = await getPlatformInfo();
    return { distroId: info.distroId, packageManager: info.distroPkgMngr };
}
export interface Config {
    port: number;
    theme: "system" | "dark" | "light";
    notify_updates: boolean;
}

export interface PlatformInfo {
    isWindows: boolean;
    windowsVersion: string | null;
    isMacOs: boolean;
    macOsVersion: string | null;
    distroId: string | null;
    distroPkgMngr: string | null;
}

export interface InstalledPrograms {
    winget: {
        installed: boolean;
        version: string | null;
    };
    apt: {
        installed: boolean;
        version: string | null;
    };
    dnf: {
        installed: boolean;
        version: string | null;
    };
    pacman: {
        installed: boolean;
        version: string | null;
    };
    brew: {
        installed: boolean;
        version: string | null;
    };
    python: {
        installed: boolean;
        version: string | null;
    };
    pip: {
        installed: boolean;
        version: string | null;
    };
    python3: {
        installed: boolean;
        version: string | null;
    };
    pip3: {
        installed: boolean;
        version: string | null;
    };
    ffmpeg: {
        installed: boolean;
        version: string | null;
    };
    nodejs: {
        installed: boolean;
        version: string | null;
    };
    pytubepp: {
        installed: boolean;
        version: string | null;
    };
}

export interface WebSocketMessage {
    url: string;
    command: string;
    argument: string;
}

export interface Stream {
    itag: string;
    mime_type: string;
    res: string;
    fps: string;
    vcodec: string;
}

export interface LatestExtensionResponse {
    version: string;
    notes: string;
    browsers: {
        chrome: {
            url: string;
        },
        firefox: {
            url: string;
        }
    }
}

export interface CurrentExtension {
    version: string;
}
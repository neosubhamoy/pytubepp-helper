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
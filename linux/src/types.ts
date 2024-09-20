export interface InstalledPrograms {
    apt: {
        installed: boolean;
        version: string | null;
    };
    dnf: {
        installed: boolean;
        version: string | null;
    }
    python: {
        installed: boolean;
        version: string | null;
    };
    pip: {
        installed: boolean;
        version: string | null;
    };
    ffmpeg: {
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
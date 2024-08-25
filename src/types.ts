export interface InstalledPrograms {
    python: {
        installed: boolean;
        version: string | null;
    };
    ffmpeg: {
        installed: boolean;
        version: string | null;
    };
    pytubefix: {
        installed: boolean
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
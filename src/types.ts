export enum FormatType {
    Markdown = 'markdown',
    EPUB = 'epub'
}

export interface SubmitResponse {
    success: boolean;
    sessionID?: string;
    error?: string;
}

export interface ConversionResultData {
    downloadURL: string;
}

export interface ConversionResult {
    state: 'completed' | 'failed' | 'processing' | 'pending';
    data?: ConversionResultData;
    error?: string;
}

export interface ConversionOptions {
    formatType?: FormatType;
    model?: string;
    wait?: boolean;
    maxWait?: number;
    checkInterval?: number;
}

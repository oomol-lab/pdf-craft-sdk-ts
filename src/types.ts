export enum FormatType {
    Markdown = 'markdown',
    EPUB = 'epub'
}

export enum PollingStrategy {
    Fixed = 1,
    Exponential = 1.5,
    Aggressive = 2
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
    /** Maximum wait time in milliseconds (default: 7200000 - 2 hours) */
    maxWaitMs?: number;
    /** Initial polling interval in milliseconds (default: 1000) */
    checkIntervalMs?: number;
    /** Maximum polling interval in milliseconds (default: 5000) */
    maxCheckIntervalMs?: number;
    /** 
     * Backoff factor for polling interval.
     * Use PollingStrategy enum or provide a custom number.
     * default: PollingStrategy.Exponential (1.5)
     */
    backoffFactor?: PollingStrategy | number;
    
    /** @deprecated Use maxWaitMs instead (seconds) */
    maxWait?: number;
    /** @deprecated Use checkIntervalMs instead (seconds) */
    checkInterval?: number;
    /** @deprecated Use maxCheckIntervalMs instead (seconds) */
    maxCheckInterval?: number;
}

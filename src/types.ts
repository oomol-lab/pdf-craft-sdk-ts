export enum FormatType {
    Markdown = 'markdown',
    EPUB = 'epub'
}

export enum PollingStrategy {
    Fixed = 1,
    Exponential = 1.5,
    Aggressive = 2
}

export enum BatchStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Paused = 'paused'
}

export enum JobStatus {
    Pending = 'pending',
    Queued = 'queued',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Paused = 'paused'
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
    /** Whether to process footnotes (default: false) */
    includesFootnotes?: boolean;
    /** Whether to ignore PDF parsing errors (default: true) */
    ignorePdfErrors?: boolean;
    /** Whether to ignore OCR recognition errors (default: true) */
    ignoreOcrErrors?: boolean;
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
}

// Upload related types
export interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    currentPart: number;
    totalParts: number;
    percentage: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

export interface InitUploadResponse {
    uploadId: string;
    partSize: number;
    totalParts: number;
    uploadedParts?: number[];
    presignedUrls: Record<number, string>;
}

export interface GetUploadUrlResponse {
    url: string;
}

export interface ConvertLocalPdfOptions extends ConversionOptions {
    progressCallback?: ProgressCallback;
    uploadMaxRetries?: number;
}

// Batch related types
export interface BatchFile {
    url: string;
    fileName: string;
    fileSize?: number;
}

export interface CreateBatchResponse {
    batchId: string;
    totalFiles: number;
    status: string;
    outputFormat: string;
    createdAt: string;
}

export interface BatchDetail {
    id: string;
    userId: string;
    status: string;
    outputFormat: string;
    includesFootnotes: boolean;
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    progress: number;
    createdAt: string;
    updatedAt: string;
}

export interface JobDetail {
    id: string;
    batchId: string;
    userId: string;
    outputFormat: string;
    sourceUrl: string;
    fileName: string;
    fileSize?: number;
    status: string;
    resultUrl?: string;
    errorMessage?: string;
    progress?: number;
    retryCount?: number;
    taskId?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface GetBatchesResponse {
    batches: BatchDetail[];
    pagination: Pagination;
}

export interface GetJobsResponse {
    jobs: JobDetail[];
    pagination: Pagination;
}

export interface ConcurrentStatus {
    maxConcurrentJobs: number;
    currentRunningJobs: number;
    canSubmitNewJob: boolean;
    availableSlots?: number;
    queuedJobs?: number;
}

export interface OperationResponse {
    batchId?: string;
    jobId?: string;
    queuedJobs?: number;
    cancelledJobs?: number;
    retriedJobs?: number;
    pausedJobs?: number;
    resumedJobs?: number;
    status?: string;
}

# PDF Craft SDK (TypeScript)

A TypeScript SDK for interacting with the PDF Craft API. It simplifies the process of converting PDFs to Markdown or EPUB by handling authentication, task submission, and result polling.

## Installation

```bash
npm install pdf-craft-sdk-ts
# or
yarn add pdf-craft-sdk-ts
```

## Usage

### Run the Example

We provide a ready-to-run example in `examples/demo.ts`. You can run it directly:

```bash
# Set your API key
export PDF_CRAFT_API_KEY="your-api-key"

# Run the demo
npm run example
```

### Basic Usage

The SDK provides a high-level `convert` method that handles everything for you (submission + polling).

```typescript
import { PDFCraftClient, FormatType } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient("YOUR_API_KEY");

async function main() {
    try {
        const pdfUrl = "cache://your-pdf-file.pdf";
        const downloadUrl = await client.convert(pdfUrl, {
            formatType: FormatType.Markdown
        });
        console.log(`Conversion successful! Download URL: ${downloadUrl}`);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
```

### Advanced Usage

If you prefer to handle the steps manually:

```typescript
import { PDFCraftClient, FormatType } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient("YOUR_API_KEY");

async function manualFlow() {
    // 1. Submit task
    const taskId = await client.submitConversion("cache://your-pdf-file.pdf", FormatType.Markdown);
    console.log(`Task submitted. ID: ${taskId}`);

    // 2. Wait for completion explicitly
    try {
        const downloadUrl = await client.waitForCompletion(taskId, FormatType.Markdown);
        console.log(`Download URL: ${downloadUrl}`);
    } catch (error) {
        console.error("Conversion failed or timed out:", error);
    }
}
```

### Configuration Options

The `convert` method accepts an options object:

#### Basic Options

- `formatType`: FormatType.Markdown | FormatType.EPUB (default: FormatType.Markdown)
- `model`: Model to use (default: 'gundam')
- `wait`: Whether to wait for completion (default: true)

#### Processing Options

- `includesFootnotes`: Whether to process footnotes (default: false)
- `ignorePdfErrors`: Whether to ignore PDF parsing errors. When true, continues processing even if PDF has errors (default: true)
- `ignoreOcrErrors`: Whether to ignore OCR recognition errors. When true, continues processing other pages even if some OCR fails (default: true)

#### Polling Options

- `maxWaitMs`: Maximum wait time in milliseconds (default: 7200000, i.e., 2 hours)
- `checkIntervalMs`: Initial polling interval in milliseconds (default: 1000)
- `maxCheckIntervalMs`: Maximum polling interval in milliseconds (default: 5000)
- `backoffFactor`: Multiplier for increasing interval after each check. Use `PollingStrategy` enum or a number. (default: PollingStrategy.Exponential / 1.5)

### Examples

#### 1. Processing with Footnotes

Enable footnote processing and strict error handling:

```typescript
await client.convert(pdfUrl, {
    includesFootnotes: true,  // Process footnotes
    ignorePdfErrors: false,   // Fail on PDF errors
    ignoreOcrErrors: false    // Fail on OCR errors
});
```

#### 2. Fast Start (Default)

Starts checking quickly (1s) and gradually slows down to every 5s. Good for most files.

```typescript
import { PollingStrategy } from 'pdf-craft-sdk-ts';

await client.convert(pdfUrl, {
    checkIntervalMs: 1000,    // Start fast (1s)
    maxCheckIntervalMs: 5000, // Cap at 5s
    backoffFactor: PollingStrategy.Exponential
});
```

#### 3. Stable Polling (Fixed Interval)

Checks exactly every 3 seconds, no matter how long it takes.

```typescript
import { PollingStrategy } from 'pdf-craft-sdk-ts';

await client.convert(pdfUrl, {
    checkIntervalMs: 3000,
    backoffFactor: PollingStrategy.Fixed  // Disable backoff (value: 1)
});
```

#### 4. Long Running Tasks

For very large files, start slow and check infrequently.

```typescript
await client.convert(pdfUrl, {
    checkIntervalMs: 5000,
    maxCheckIntervalMs: 60000, // 1 minute
    backoffFactor: PollingStrategy.Aggressive // Value: 2
});
```

## Local File Upload

The SDK supports uploading local PDF files with progress tracking and resumable uploads.

### Upload a Local File

```typescript
import { PDFCraftClient } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Simple upload
const cacheUrl = await client.uploadFile("path/to/document.pdf");
console.log(`File uploaded: ${cacheUrl}`);
```

### Upload with Progress Tracking

```typescript
import { PDFCraftClient, UploadProgress } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

const onProgress = (progress: UploadProgress) => {
    console.log(`Upload progress: ${progress.percentage.toFixed(2)}%`);
    console.log(`Part ${progress.currentPart}/${progress.totalParts}`);
    console.log(`Bytes: ${progress.uploadedBytes}/${progress.totalBytes}`);
};

const cacheUrl = await client.uploadFile(
    "large-document.pdf",
    onProgress,
    3  // Max retries per part (default: 3)
);
```

### Upload and Convert in One Step

```typescript
import { PDFCraftClient, FormatType } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Upload and convert automatically
const downloadUrl = await client.convertLocalPdf(
    "document.pdf",
    {
        formatType: FormatType.Markdown,
        progressCallback: (progress) => {
            console.log(`Uploading: ${progress.percentage.toFixed(2)}%`);
        },
        includesFootnotes: true,
        uploadMaxRetries: 5
    }
);

console.log(`Conversion complete: ${downloadUrl}`);
```

### Manual Upload and Convert

For more control over the process:

```typescript
import { PDFCraftClient, FormatType } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Step 1: Upload file
const cacheUrl = await client.uploadFile("document.pdf");

// Step 2: Submit conversion task
const taskId = await client.submitConversion(
    cacheUrl,
    FormatType.Markdown,
    "gundam",  // model
    true,      // includesFootnotes
    true,      // ignorePdfErrors
    true       // ignoreOcrErrors
);

// Step 3: Wait for completion
const downloadUrl = await client.waitForCompletion(taskId);
console.log(`Download: ${downloadUrl}`);
```

## Batch Processing

Process multiple PDF files in parallel with batch operations.

### Create and Start a Batch

```typescript
import { PDFCraftClient, FormatType, BatchFile } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Upload multiple files first
const files: BatchFile[] = [
    { url: "cache://file1.pdf", fileName: "document1.pdf" },
    { url: "cache://file2.pdf", fileName: "document2.pdf" },
    { url: "https://example.com/file3.pdf", fileName: "document3.pdf" }
];

// Create batch
const batch = await client.createBatch(
    files,
    FormatType.Markdown,
    false  // includesFootnotes
);

console.log(`Batch created: ${batch.batchId}`);
console.log(`Total files: ${batch.totalFiles}`);

// Start processing
const result = await client.startBatch(batch.batchId);
console.log(`Queued jobs: ${result.queuedJobs}`);
```

### Monitor Batch Progress

```typescript
import { PDFCraftClient, BatchStatus } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Poll for completion
let completed = false;
while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

    const batchDetail = await client.getBatch(batchId);
    console.log(`Progress: ${batchDetail.progress}%`);
    console.log(`Completed: ${batchDetail.completedFiles}/${batchDetail.totalFiles}`);

    if (batchDetail.status === BatchStatus.Completed) {
        completed = true;
        console.log("Batch processing complete!");
    } else if (batchDetail.status === BatchStatus.Failed) {
        console.log("Batch processing failed!");
        break;
    }
}
```

### Get Batch Results

```typescript
import { PDFCraftClient, JobStatus } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

const jobs = await client.getBatchJobs(batchId);

for (const job of jobs.jobs) {
    if (job.status === JobStatus.Completed) {
        console.log(`✓ ${job.fileName}: ${job.resultUrl}`);
    } else if (job.status === JobStatus.Failed) {
        console.log(`✗ ${job.fileName}: ${job.errorMessage}`);
    }
}
```

### Batch Control Operations

```typescript
const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Pause batch
await client.pauseBatch(batchId);

// Resume batch
await client.resumeBatch(batchId);

// Retry failed jobs
const retryResult = await client.retryFailedJobs(batchId);
console.log(`Retried ${retryResult.retriedJobs} jobs`);

// Cancel batch
await client.cancelBatch(batchId);

// Retry a specific job
await client.retryJob(jobId);

// Cancel a specific job
await client.cancelJob(jobId);
```

### Check Concurrent Status

```typescript
const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

const status = await client.getConcurrentStatus();

console.log(`Max concurrent jobs: ${status.maxConcurrentJobs}`);
console.log(`Currently running: ${status.currentRunningJobs}`);
console.log(`Can submit new job: ${status.canSubmitNewJob}`);
console.log(`Available slots: ${status.availableSlots}`);
console.log(`Queued jobs: ${status.queuedJobs}`);
```

### List All Batches

```typescript
import { PDFCraftClient, BatchStatus } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

// Get all batches (paginated)
const batches = await client.getBatches(
    1,    // page
    20,   // pageSize
    undefined,  // status filter (optional)
    'createdAt',  // sortBy
    'desc'  // sortOrder
);

console.log(`Total batches: ${batches.pagination.total}`);
console.log(`Page ${batches.pagination.page}/${batches.pagination.totalPages}`);

// Get only processing batches
const processingBatches = await client.getBatches(
    1,
    20,
    BatchStatus.Processing
);
```

## Client Configuration

The client constructor supports both simple and advanced configuration:

### Simple Configuration (Backward Compatible)

```typescript
const client = new PDFCraftClient("YOUR_API_KEY");
```

### Advanced Configuration

```typescript
import { PDFCraftClient } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({
    apiKey: "YOUR_API_KEY",
    baseUrl: "https://fusion-api.oomol.com/v1",  // Optional
    batchBaseUrl: "https://pdf-server.oomol.com/api/v1/conversion",  // Optional
    uploadBaseUrl: "https://llm.oomol.com/api/tasks/files/remote-cache"  // Optional
});
```

## Complete Example

Here's a complete workflow combining upload and batch processing:

```typescript
import {
    PDFCraftClient,
    FormatType,
    UploadProgress,
    BatchStatus,
    JobStatus
} from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

async function processBatch() {
    // 1. Upload local files with progress tracking
    const localFiles = ["doc1.pdf", "doc2.pdf", "doc3.pdf"];
    const uploadedFiles = [];

    for (const file of localFiles) {
        const onProgress = (progress: UploadProgress) => {
            console.log(`${file}: ${progress.percentage.toFixed(2)}%`);
        };

        const cacheUrl = await client.uploadFile(file, onProgress);
        uploadedFiles.push({
            url: cacheUrl,
            fileName: file
        });
    }

    // 2. Create and start batch
    const batch = await client.createBatch(
        uploadedFiles,
        FormatType.Markdown,
        true  // includesFootnotes
    );

    await client.startBatch(batch.batchId);
    console.log(`Batch ${batch.batchId} started`);

    // 3. Monitor progress
    let completed = false;
    while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const batchDetail = await client.getBatch(batch.batchId);
        console.log(`Progress: ${batchDetail.progress}%`);

        if (batchDetail.status === BatchStatus.Completed) {
            completed = true;
        }
    }

    // 4. Get results
    const jobs = await client.getBatchJobs(batch.batchId);
    for (const job of jobs.jobs) {
        if (job.status === JobStatus.Completed) {
            console.log(`✓ ${job.fileName}: ${job.resultUrl}`);
        } else {
            console.log(`✗ ${job.fileName}: ${job.errorMessage}`);
        }
    }
}

processBatch().catch(console.error);
```

## API Reference

### Client Methods

#### `convert(pdfUrl: string, options?: ConversionOptions): Promise<string>`

High-level method that submits a conversion task and waits for completion.

#### `submitConversion(pdfUrl: string, formatType?: FormatType, model?: string, includesFootnotes?: boolean, ignorePdfErrors?: boolean, ignoreOcrErrors?: boolean): Promise<string>`

Submit a conversion task and get the task ID.

#### `waitForCompletion(taskId: string, formatType?: FormatType, maxWaitMs?: number, checkIntervalMs?: number, maxCheckIntervalMs?: number, backoffFactor?: number): Promise<string>`

Poll for task completion and return the download URL.

#### `uploadFile(filePath: string, progressCallback?: ProgressCallback, maxRetries?: number): Promise<string>`

Upload a local file with progress tracking and resumable upload support.

#### `convertLocalPdf(filePath: string, options?: ConvertLocalPdfOptions): Promise<string>`

Upload a local PDF file and convert it in one step.

#### `createBatch(files: BatchFile[], outputFormat?: FormatType | string, includesFootnotes?: boolean): Promise<CreateBatchResponse>`

Create a batch conversion task with multiple files.

#### `startBatch(batchId: string): Promise<OperationResponse>`

Start processing a batch.

#### `getBatch(batchId: string): Promise<BatchDetail>`

Get details of a specific batch.

#### `getBatches(page?: number, pageSize?: number, status?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<GetBatchesResponse>`

Get a paginated list of batches.

#### `getBatchJobs(batchId: string, page?: number, pageSize?: number, status?: string): Promise<GetJobsResponse>`

Get jobs within a batch.

#### `pauseBatch(batchId: string): Promise<OperationResponse>`

Pause a batch.

#### `resumeBatch(batchId: string): Promise<OperationResponse>`

Resume a paused batch.

#### `cancelBatch(batchId: string): Promise<OperationResponse>`

Cancel a batch.

#### `retryJob(jobId: string): Promise<OperationResponse>`

Retry a specific job.

#### `retryFailedJobs(batchId: string): Promise<OperationResponse>`

Retry all failed jobs in a batch.

#### `cancelJob(jobId: string): Promise<OperationResponse>`

Cancel a specific job.

#### `getConcurrentStatus(): Promise<ConcurrentStatus>`

Get the current concurrency status.

### Types and Enums

#### `FormatType`

```typescript
enum FormatType {
    Markdown = 'markdown',
    EPUB = 'epub'
}
```

#### `PollingStrategy`

```typescript
enum PollingStrategy {
    Fixed = 1,           // No backoff
    Exponential = 1.5,   // Gradual increase
    Aggressive = 2       // Fast increase
}
```

#### `BatchStatus`

```typescript
enum BatchStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Paused = 'paused'
}
```

#### `JobStatus`

```typescript
enum JobStatus {
    Pending = 'pending',
    Queued = 'queued',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Paused = 'paused'
}
```

#### `UploadProgress`

```typescript
interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    currentPart: number;
    totalParts: number;
    percentage: number;
}
```

#### `BatchFile`

```typescript
interface BatchFile {
    url: string;
    fileName: string;
    fileSize?: number;
}
```

## Features

- ✅ **PDF to Markdown/EPUB conversion** - Convert PDFs to readable formats
- ✅ **Local file upload** - Upload PDF files from your local filesystem
- ✅ **Progress tracking** - Monitor upload and conversion progress
- ✅ **Resumable uploads** - Automatic retry and resume for failed uploads
- ✅ **Batch processing** - Process multiple PDFs in parallel
- ✅ **Batch management** - Pause, resume, cancel, and retry batches
- ✅ **Flexible polling** - Customizable polling strategies for long-running tasks
- ✅ **Error handling** - Configurable error tolerance for PDF and OCR errors
- ✅ **Footnote processing** - Optional footnote extraction
- ✅ **TypeScript support** - Full type definitions included

## Error Handling

The SDK throws two types of errors:

- `APIError`: API-related errors (authentication, invalid requests, etc.)
- `TimeoutError`: Task exceeded the maximum wait time

```typescript
import { PDFCraftClient } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: "YOUR_API_KEY" });

try {
    const downloadUrl = await client.convert(pdfUrl);
    console.log(`Success: ${downloadUrl}`);
} catch (error: any) {
    if (error.name === 'APIError') {
        console.error(`API Error: ${error.message}`);
    } else if (error.name === 'TimeoutError') {
        console.error('Conversion timed out');
    } else {
        console.error(`Unknown error: ${error.message}`);
    }
}
```

## License

MIT

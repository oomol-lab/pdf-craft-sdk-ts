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

- `formatType`: FormatType.Markdown | FormatType.EPUB (default: FormatType.Markdown)
- `model`: Model to use (default: 'gundam')
- `wait`: Whether to wait for completion (default: true)
- `maxWaitMs`: Maximum wait time in milliseconds (default: 7200000, i.e., 2 hours)
- `checkIntervalMs`: Initial polling interval in milliseconds (default: 1000)
- `maxCheckIntervalMs`: Maximum polling interval in milliseconds (default: 5000)
- `backoffFactor`: Multiplier for increasing interval after each check. Use `PollingStrategy` enum or a number. (default: PollingStrategy.Exponential / 1.5)

### Examples

#### 1. Fast Start (Default)
Starts checking quickly (1s) and gradually slows down to every 5s. Good for most files.

```typescript
import { PollingStrategy } from 'pdf-craft-sdk-ts';

await client.convert(pdfUrl, {
    checkIntervalMs: 1000,    // Start fast (1s)
    maxCheckIntervalMs: 5000, // Cap at 5s
    backoffFactor: PollingStrategy.Exponential
});
```

#### 2. Stable Polling (Fixed Interval)
Checks exactly every 3 seconds, no matter how long it takes.

```typescript
import { PollingStrategy } from 'pdf-craft-sdk-ts';

await client.convert(pdfUrl, {
    checkIntervalMs: 3000,
    backoffFactor: PollingStrategy.Fixed  // Disable backoff (value: 1)
});
```

#### 3. Long Running Tasks
For very large files, start slow and check infrequently.

```typescript
await client.convert(pdfUrl, {
    checkIntervalMs: 5000,
    maxCheckIntervalMs: 60000, // 1 minute
    backoffFactor: PollingStrategy.Aggressive // Value: 2
});
```

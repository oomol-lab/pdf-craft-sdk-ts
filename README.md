# PDF Craft SDK (TypeScript)

A TypeScript SDK for interacting with the PDF Craft API. It simplifies the process of converting PDFs to Markdown or EPUB by handling authentication, task submission, and result polling.

## Installation

```bash
npm install pdf-craft-sdk-ts
# or
yarn add pdf-craft-sdk-ts
```

## Usage

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
- `maxWait`: Maximum wait time in seconds (default: 300)
- `checkInterval`: Polling interval in seconds (default: 5)

```typescript
await client.convert(pdfUrl, {
    model: "gundam",
    maxWait: 600,
    checkInterval: 2
});
```

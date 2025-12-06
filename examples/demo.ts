import { PDFCraftClient, FormatType, PollingStrategy } from '../src';

// Ensure you have your API key set in the environment variables
// or replace 'YOUR_API_KEY' with your actual key.
const API_KEY = process.env.PDF_CRAFT_API_KEY || 'YOUR_API_KEY';
const BASE_URL = process.env.PDF_CRAFT_BASE_URL || 'https://fusion-api.oomol.com/v1';

// A sample PDF URL. In a real scenario, this would be a URL accessible by the API.
// The API supports 'cache://' protocol for internal files or public HTTP/HTTPS URLs.
const SAMPLE_PDF_URL = process.env.SAMPLE_PDF_URL || 'https://arxiv.org/pdf/2312.12345.pdf'; // Example placeholder

async function runDemo() {
    console.log("Initializing PDF Craft Client...");
    
    if (API_KEY === 'YOUR_API_KEY') {
        console.warn("⚠️  Warning: Using placeholder API Key. Requests will likely fail.");
        console.warn("   Please set PDF_CRAFT_API_KEY environment variable.");
    }

    const client = new PDFCraftClient(API_KEY, BASE_URL);

    console.log(`\n--- Demo 1: Simple Conversion (Markdown) ---`);
    console.log(`Target PDF: ${SAMPLE_PDF_URL}`);

    try {
        // High-level 'convert' method handles submission and polling
        console.log("Starting conversion...");
        const downloadUrl = await client.convert(SAMPLE_PDF_URL, {
            formatType: FormatType.Markdown,
            model: 'gundam',
            wait: true,
            maxWaitMs: 600000, // Wait up to 10 minutes
            // Example of using PollingStrategy
            backoffFactor: PollingStrategy.Exponential
        });
        
        console.log("✅ Conversion successful!");
        console.log(`📥 Download URL: ${downloadUrl}`);
    } catch (error: any) {
        console.error("❌ Conversion failed:", error.message);
    }

    console.log(`\n--- Demo 2: Advanced/Manual Flow (EPUB) ---`);
    try {
        // 1. Submit task manually: This ONLY starts the task and returns immediately.
        // Useful if you want to show "Processing..." UI or handle the polling yourself.
        console.log("Submitting task...");
        const sessionId = await client.submitConversion(
            SAMPLE_PDF_URL, 
            FormatType.EPUB, 
            'gundam'
        );
        console.log(`Task submitted. Session ID: ${sessionId}`);

        // 2. Poll for results manually: Check the status periodically until it's done.
        // 'waitForCompletion' is a helper that does the polling loop for you.
        console.log("Waiting for completion...");
        const epubUrl = await client.waitForCompletion(sessionId, FormatType.EPUB);
        
        console.log("✅ Conversion successful!");
        console.log(`📥 EPUB Download URL: ${epubUrl}`);

    } catch (error: any) {
        console.error("❌ Manual flow failed:", error.message);
    }
}

runDemo().catch(err => {
    console.error("Unhandled error in demo:", err);
});

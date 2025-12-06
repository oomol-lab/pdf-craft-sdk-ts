import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIError, TimeoutError } from './errors';
import { FormatType, SubmitResponse, ConversionResult, ConversionOptions } from './types';

export class PDFCraftClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor(apiKey: string, baseURL: string = "https://fusion-api.oomol.com/v1") {
        this.baseURL = baseURL.replace(/\/$/, "");
        this.client = axios.create({
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        });
    }

    /**
     * Submit PDF conversion task
     * @param pdfUrl URL of the PDF file
     * @param formatType 'markdown' or 'epub'
     * @param model Model to use, default is 'gundam'
     * @returns sessionID
     */
    async submitConversion(pdfUrl: string, formatType: FormatType = FormatType.Markdown, model: string = "gundam"): Promise<string> {
        const endpoint = `${this.baseURL}/pdf-transform-${formatType}/submit`;
        const data = {
            pdfURL: pdfUrl,
            model: model
        };

        try {
            const response: AxiosResponse<SubmitResponse> = await this.client.post(endpoint, data);
            const result = response.data;

            if (result.success && result.sessionID) {
                return result.sessionID;
            } else {
                throw new APIError(`Failed to submit task: ${result.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            if (error instanceof APIError) throw error;
            throw new APIError(`Request failed: ${error.message}`);
        }
    }

    /**
     * Query conversion result
     * @param taskId The sessionID of the task
     * @param formatType 'markdown' or 'epub'
     * @returns ConversionResult
     */
    async getConversionResult(taskId: string, formatType: FormatType = FormatType.Markdown): Promise<ConversionResult> {
        const endpoint = `${this.baseURL}/pdf-transform-${formatType}/result/${taskId}`;
        
        try {
            const response: AxiosResponse<ConversionResult> = await this.client.get(endpoint);
            return response.data;
        } catch (error: any) {
            throw new APIError(`Request failed: ${error.message}`);
        }
    }

    /**
     * Poll until conversion completes
     * @param taskId The sessionID of the task
     * @param formatType 'markdown' or 'epub'
     * @param maxWait Maximum wait time in seconds
     * @param checkInterval Interval between checks in seconds
     * @returns downloadUrl
     */
    async waitForCompletion(
        taskId: string, 
        formatType: FormatType = FormatType.Markdown, 
        maxWait: number = 300, 
        checkInterval: number = 5
    ): Promise<string> {
        const startTime = Date.now();
        const maxWaitMs = maxWait * 1000;
        const checkIntervalMs = checkInterval * 1000;

        while (Date.now() - startTime < maxWaitMs) {
            const result = await this.getConversionResult(taskId, formatType);

            if (result.state === 'completed') {
                if (result.data && result.data.downloadURL) {
                    return result.data.downloadURL;
                } else {
                    throw new APIError(`Task completed but downloadURL missing in response: ${JSON.stringify(result)}`);
                }
            } else if (result.state === 'failed') {
                throw new APIError(`Conversion failed: ${result.error || 'Unknown error'}`);
            }

            await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
        }

        throw new TimeoutError("Conversion timeout");
    }

    /**
     * High-level method to convert PDF.
     * 
     * If wait is true (default), submits and waits for completion, returning the download URL.
     * If wait is false, submits and returns the task ID.
     */
    async convert(
        pdfUrl: string, 
        options: ConversionOptions = {}
    ): Promise<string> {
        const {
            formatType = FormatType.Markdown,
            model = "gundam",
            wait = true,
            maxWait = 300,
            checkInterval = 5
        } = options;

        const taskId = await this.submitConversion(pdfUrl, formatType, model);

        if (wait) {
            return this.waitForCompletion(taskId, formatType, maxWait, checkInterval);
        } else {
            return taskId;
        }
    }
}

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createReadStream, statSync } from 'fs';
import { extname } from 'path';
import { APIError, TimeoutError } from './errors';
import {
    FormatType,
    SubmitResponse,
    ConversionResult,
    ConversionOptions,
    InitUploadResponse,
    UploadProgress,
    ProgressCallback,
    ConvertLocalPdfOptions,
    BatchFile,
    CreateBatchResponse,
    OperationResponse,
    BatchDetail,
    GetBatchesResponse,
    GetJobsResponse,
    ConcurrentStatus
} from './types';

export interface PDFCraftClientOptions {
    apiKey: string;
    baseUrl?: string;
    batchBaseUrl?: string;
    uploadBaseUrl?: string;
}

export class PDFCraftClient {
    private client: AxiosInstance;
    private baseURL: string;
    private batchBaseURL: string;
    private uploadBaseURL: string;
    private apiKey: string;

    constructor(options: string | PDFCraftClientOptions) {
        // 支持向后兼容的构造函数
        if (typeof options === 'string') {
            this.apiKey = options;
            this.baseURL = "https://fusion-api.oomol.com/v1";
            this.batchBaseURL = "https://pdf-server.oomol.com/api/v1/conversion";
            this.uploadBaseURL = "https://llm.oomol.com/api/tasks/files/remote-cache";
        } else {
            this.apiKey = options.apiKey;
            this.baseURL = (options.baseUrl || "https://fusion-api.oomol.com/v1").replace(/\/$/, "");
            this.batchBaseURL = (options.batchBaseUrl || "https://pdf-server.oomol.com/api/v1/conversion").replace(/\/$/, "");
            this.uploadBaseURL = (options.uploadBaseUrl || "https://llm.oomol.com/api/tasks/files/remote-cache").replace(/\/$/, "");
        }

        this.client = axios.create({
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            }
        });
    }

    /**
     * Submit PDF conversion task
     * @param pdfUrl URL of the PDF file
     * @param formatType 'markdown' or 'epub'
     * @param model Model to use, default is 'gundam'
     * @param includesFootnotes Whether to process footnotes, default false
     * @param ignorePdfErrors Whether to ignore PDF parsing errors, default true
     * @param ignoreOcrErrors Whether to ignore OCR recognition errors, default true
     * @returns sessionID
     */
    async submitConversion(
        pdfUrl: string,
        formatType: FormatType = FormatType.Markdown,
        model: string = "gundam",
        includesFootnotes: boolean = false,
        ignorePdfErrors: boolean = true,
        ignoreOcrErrors: boolean = true
    ): Promise<string> {
        const endpoint = `${this.baseURL}/pdf-transform-${formatType}/submit`;
        const data = {
            pdfURL: pdfUrl,
            model: model,
            includes_footnotes: includesFootnotes,
            ignore_pdf_errors: ignorePdfErrors,
            ignore_ocr_errors: ignoreOcrErrors
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
     * @param maxWaitMs Maximum wait time in milliseconds (default: 7200000)
     * @param checkIntervalMs Initial interval between checks in milliseconds (default: 1000)
     * @param maxCheckIntervalMs Maximum interval between checks in milliseconds (default: 5000)
     * @param backoffFactor Factor to increase check interval by (default: 1.5)
     * @returns downloadUrl
     */
    async waitForCompletion(
        taskId: string, 
        formatType: FormatType = FormatType.Markdown, 
        maxWaitMs: number = 7200000, 
        checkIntervalMs: number = 1000,
        maxCheckIntervalMs: number = 5000,
        backoffFactor: number = 1.5
    ): Promise<string> {
        const startTime = Date.now();
        let currentIntervalMs = checkIntervalMs;

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

            await new Promise(resolve => setTimeout(resolve, currentIntervalMs));
            
            // Increase interval for next check, up to maxCheckInterval
            currentIntervalMs = Math.min(currentIntervalMs * backoffFactor, maxCheckIntervalMs);
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
            includesFootnotes = false,
            ignorePdfErrors = true,
            ignoreOcrErrors = true,
            maxWaitMs = 7200000,
            checkIntervalMs = 1000,
            maxCheckIntervalMs = 5000,
            backoffFactor = 1.5
        } = options;

        const taskId = await this.submitConversion(
            pdfUrl,
            formatType,
            model,
            includesFootnotes,
            ignorePdfErrors,
            ignoreOcrErrors
        );

        if (wait) {
            return this.waitForCompletion(taskId, formatType, maxWaitMs, checkIntervalMs, maxCheckIntervalMs, backoffFactor);
        } else {
            return taskId;
        }
    }

    // ========== 上传功能 ==========

    /**
     * 上传本地 PDF 文件,带进度追踪和断点续传
     * @param filePath 本地文件路径
     * @param progressCallback 进度回调函数
     * @param maxRetries 每个分片的最大重试次数
     * @returns cache URL (cache://xxx.pdf)
     */
    async uploadFile(
        filePath: string,
        progressCallback?: ProgressCallback,
        maxRetries: number = 3
    ): Promise<string> {
        try {
            // 获取文件信息
            const stats = statSync(filePath);
            const fileSize = stats.size;
            const fileExtension = extname(filePath);

            // 初始化上传
            const initResponse = await this.initUpload(fileSize, fileExtension);

            // 创建文件流
            const fileStream = createReadStream(filePath, {
                highWaterMark: initResponse.partSize
            });

            let uploadedBytes = 0;

            // 上传分片
            for (let partNumber = 1; partNumber <= initResponse.totalParts; partNumber++) {
                // 跳过已上传的分片(断点续传)
                if (initResponse.uploadedParts && initResponse.uploadedParts.includes(partNumber)) {
                    uploadedBytes += initResponse.partSize;
                    if (progressCallback) {
                        progressCallback({
                            uploadedBytes: Math.min(uploadedBytes, fileSize),
                            totalBytes: fileSize,
                            currentPart: partNumber,
                            totalParts: initResponse.totalParts,
                            percentage: Math.min((uploadedBytes / fileSize) * 100, 100)
                        });
                    }
                    continue;
                }

                // 读取分片数据
                const partData = await this.readChunk(fileStream, initResponse.partSize);

                // 上传分片
                const presignedUrl = initResponse.presignedUrls[partNumber];
                await this.uploadPart(presignedUrl, partData, maxRetries);

                uploadedBytes += partData.length;

                // 调用进度回调
                if (progressCallback) {
                    progressCallback({
                        uploadedBytes,
                        totalBytes: fileSize,
                        currentPart: partNumber,
                        totalParts: initResponse.totalParts,
                        percentage: (uploadedBytes / fileSize) * 100
                    });
                }
            }

            // 获取最终 URL
            return await this.getUploadUrl(initResponse.uploadId);
        } catch (error: any) {
            if (error instanceof APIError) throw error;
            throw new APIError(`上传文件失败: ${error.message}`);
        }
    }

    /**
     * 一步完成本地 PDF 文件上传和转换
     * @param filePath 本地文件路径
     * @param options 转换选项,包含上传进度回调
     * @returns 下载 URL
     */
    async convertLocalPdf(
        filePath: string,
        options?: ConvertLocalPdfOptions
    ): Promise<string> {
        // 先上传文件
        const cacheUrl = await this.uploadFile(
            filePath,
            options?.progressCallback,
            options?.uploadMaxRetries ?? 3
        );

        // 然后转换
        return await this.convert(cacheUrl, options);
    }

    /**
     * 初始化分片上传
     * @private
     */
    private async initUpload(fileSize: number, fileExtension: string): Promise<InitUploadResponse> {
        const endpoint = `${this.uploadBaseURL}/init`;

        try {
            const response = await this.client.post(endpoint, {
                file_extension: fileExtension,
                size: fileSize
            });

            const result = response.data.data || response.data;

            return {
                uploadId: result.upload_id,
                partSize: result.part_size,
                totalParts: result.total_parts,
                uploadedParts: result.uploaded_parts || [],
                presignedUrls: result.presigned_urls
            };
        } catch (error: any) {
            throw new APIError(`初始化上传失败: ${error.message}`);
        }
    }

    /**
     * 上传单个分片,带重试机制
     * @private
     */
    private async uploadPart(presignedUrl: string, partData: Buffer, maxRetries: number = 3): Promise<void> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await axios.put(presignedUrl, partData, {
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                });

                if (response.status >= 200 && response.status < 300) {
                    return;
                }

                if (attempt === maxRetries - 1) {
                    throw new APIError(`上传分片失败,已重试 ${maxRetries} 次`);
                }
            } catch (error: any) {
                if (attempt === maxRetries - 1) {
                    throw new APIError(`上传分片失败: ${error.message}`);
                }
                // 指数退避
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    /**
     * 获取上传完成后的文件 URL
     * @private
     */
    private async getUploadUrl(uploadId: string): Promise<string> {
        const endpoint = `${this.uploadBaseURL}/${uploadId}/url`;

        try {
            const response = await this.client.get(endpoint);
            const result = response.data.data || response.data;
            return result.url;
        } catch (error: any) {
            throw new APIError(`获取上传 URL 失败: ${error.message}`);
        }
    }

    /**
     * 读取文件分片
     * @private
     */
    private async readChunk(stream: NodeJS.ReadableStream, size: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            let totalLength = 0;

            const onData = (chunk: Buffer) => {
                chunks.push(chunk);
                totalLength += chunk.length;

                if (totalLength >= size) {
                    cleanup();
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.slice(0, size));
                }
            };

            const onEnd = () => {
                cleanup();
                resolve(Buffer.concat(chunks));
            };

            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };

            const cleanup = () => {
                stream.removeListener('data', onData);
                stream.removeListener('end', onEnd);
                stream.removeListener('error', onError);
            };

            stream.on('data', onData);
            stream.on('end', onEnd);
            stream.on('error', onError);
        });
    }

    // ========== 批处理功能 ==========

    /**
     * 确保 formatType 是字符串格式
     * @private
     */
    private ensureFormatType(formatType: FormatType | string): string {
        if (typeof formatType === 'string') {
            return formatType;
        }
        // 枚举值本身就是字符串
        return formatType as string;
    }

    /**
     * 创建批量转换任务
     * @param files 文件列表
     * @param outputFormat 输出格式 (markdown/epub)
     * @param includesFootnotes 是否包含脚注
     * @returns 创建批次响应
     */
    async createBatch(
        files: BatchFile[],
        outputFormat: FormatType | string = FormatType.Markdown,
        includesFootnotes: boolean = false
    ): Promise<CreateBatchResponse> {
        const endpoint = `${this.batchBaseURL}/batches`;

        try {
            const response = await this.client.post(endpoint, {
                files,
                outputFormat: this.ensureFormatType(outputFormat),
                includesFootnotes
            });

            const result = response.data.data || response.data;

            return {
                batchId: result.batchId,
                totalFiles: result.totalFiles,
                status: result.status,
                outputFormat: result.outputFormat,
                createdAt: result.createdAt
            };
        } catch (error: any) {
            throw new APIError(`创建批次失败: ${error.message}`);
        }
    }

    /**
     * 启动批次处理
     * @param batchId 批次 ID
     * @returns 操作响应
     */
    async startBatch(batchId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/batches/${batchId}/start`);
    }

    /**
     * 获取批次详情
     * @param batchId 批次 ID
     * @returns 批次详情
     */
    async getBatch(batchId: string): Promise<BatchDetail> {
        const endpoint = `${this.batchBaseURL}/batches/${batchId}`;

        try {
            const response = await this.client.get(endpoint);
            return response.data.data || response.data;
        } catch (error: any) {
            throw new APIError(`获取批次详情失败: ${error.message}`);
        }
    }

    /**
     * 获取批次列表
     * @param page 页码
     * @param pageSize 每页数量
     * @param status 状态筛选
     * @param sortBy 排序字段
     * @param sortOrder 排序方向
     * @returns 批次列表响应
     */
    async getBatches(
        page: number = 1,
        pageSize: number = 20,
        status?: string,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<GetBatchesResponse> {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
            sortBy,
            sortOrder
        });

        if (status) {
            params.set('status', status);
        }

        const endpoint = `${this.batchBaseURL}/batches?${params}`;

        try {
            const response = await this.client.get(endpoint);
            const result = response.data.data || response.data;

            return {
                batches: result.batches,
                pagination: result.pagination
            };
        } catch (error: any) {
            throw new APIError(`获取批次列表失败: ${error.message}`);
        }
    }

    /**
     * 获取批次中的任务列表
     * @param batchId 批次 ID
     * @param page 页码
     * @param pageSize 每页数量
     * @param status 状态筛选
     * @returns 任务列表响应
     */
    async getBatchJobs(
        batchId: string,
        page: number = 1,
        pageSize: number = 20,
        status?: string
    ): Promise<GetJobsResponse> {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize)
        });

        if (status) {
            params.set('status', status);
        }

        const endpoint = `${this.batchBaseURL}/batches/${batchId}/jobs?${params}`;

        try {
            const response = await this.client.get(endpoint);
            const result = response.data.data || response.data;

            return {
                jobs: result.jobs,
                pagination: result.pagination
            };
        } catch (error: any) {
            throw new APIError(`获取批次任务失败: ${error.message}`);
        }
    }

    /**
     * 暂停批次
     * @param batchId 批次 ID
     * @returns 操作响应
     */
    async pauseBatch(batchId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/batches/${batchId}/pause`);
    }

    /**
     * 恢复批次
     * @param batchId 批次 ID
     * @returns 操作响应
     */
    async resumeBatch(batchId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/batches/${batchId}/resume`);
    }

    /**
     * 取消批次
     * @param batchId 批次 ID
     * @returns 操作响应
     */
    async cancelBatch(batchId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/batches/${batchId}/cancel`);
    }

    /**
     * 重试单个任务
     * @param jobId 任务 ID
     * @returns 操作响应
     */
    async retryJob(jobId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/jobs/${jobId}/retry?force=true`);
    }

    /**
     * 批量重试失败任务
     * @param batchId 批次 ID
     * @returns 操作响应
     */
    async retryFailedJobs(batchId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/batches/${batchId}/retry-failed?force=true`);
    }

    /**
     * 取消单个任务
     * @param jobId 任务 ID
     * @returns 操作响应
     */
    async cancelJob(jobId: string): Promise<OperationResponse> {
        return await this.batchOperation(`/jobs/${jobId}/cancel`);
    }

    /**
     * 获取并发状态
     * @returns 并发状态
     */
    async getConcurrentStatus(): Promise<ConcurrentStatus> {
        const endpoint = `${this.batchBaseURL}/concurrent-status`;

        try {
            const response = await this.client.get(endpoint);
            const result = response.data.data || response.data;

            return {
                maxConcurrentJobs: result.maxConcurrentJobs,
                currentRunningJobs: result.currentRunningJobs,
                canSubmitNewJob: result.canStartNew ?? result.canSubmitNewJob ?? false,
                availableSlots: result.availableSlots,
                queuedJobs: result.queuedJobs
            };
        } catch (error: any) {
            throw new APIError(`获取并发状态失败: ${error.message}`);
        }
    }

    /**
     * 批处理操作的通用方法
     * @private
     */
    private async batchOperation(path: string): Promise<OperationResponse> {
        const endpoint = `${this.batchBaseURL}${path}`;

        try {
            const response = await this.client.post(endpoint);
            return response.data.data || response.data;
        } catch (error: any) {
            throw new APIError(`批处理操作失败: ${error.message}`);
        }
    }
}

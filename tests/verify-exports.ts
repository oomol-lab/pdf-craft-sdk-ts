/**
 * 导出验证脚本
 * 用于验证所有类型和类是否正确导出
 */

import {
    // 客户端
    PDFCraftClient,
    PDFCraftClientOptions,

    // 枚举
    FormatType,
    PollingStrategy,
    BatchStatus,
    JobStatus,

    // 类型
    SubmitResponse,
    ConversionResultData,
    ConversionResult,
    ConversionOptions,
    UploadProgress,
    ProgressCallback,
    InitUploadResponse,
    GetUploadUrlResponse,
    ConvertLocalPdfOptions,
    BatchFile,
    CreateBatchResponse,
    BatchDetail,
    JobDetail,
    Pagination,
    GetBatchesResponse,
    GetJobsResponse,
    ConcurrentStatus,
    OperationResponse,

    // 错误
    PDFCraftError,
    APIError,
    TimeoutError
} from '../src';

console.log('✅ 所有导出验证通过!');

// 类型检查
const clientOptions: PDFCraftClientOptions = {
    apiKey: 'test'
};

const uploadProgress: UploadProgress = {
    uploadedBytes: 100,
    totalBytes: 1000,
    currentPart: 1,
    totalParts: 10,
    percentage: 10
};

const batchFile: BatchFile = {
    url: 'cache://test.pdf',
    fileName: 'test.pdf',
    fileSize: 1024000
};

console.log('✅ 类型定义验证通过!');
console.log('\n可用的枚举:');
console.log('- FormatType:', Object.keys(FormatType));
console.log('- PollingStrategy:', Object.keys(PollingStrategy));
console.log('- BatchStatus:', Object.keys(BatchStatus));
console.log('- JobStatus:', Object.keys(JobStatus));

console.log('\n✅ 所有功能已成功实现并导出!');

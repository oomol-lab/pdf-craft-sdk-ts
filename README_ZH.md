# PDF Craft SDK - TypeScript

一个用于 PDF Craft API 的 TypeScript SDK,支持本地文件上传、批处理和远程 PDF 转换。

[English](README.md) | 简体中文

## 功能特性

- ✨ **本地文件上传**: 支持分片上传本地 PDF 文件,带进度追踪
- 📦 **批处理 API**: 创建和管理批量转换任务
- 🔄 **转换 API**: 将 PDF 转换为 Markdown 或 EPUB 格式
- 📊 **进度追踪**: 实时上传进度回调
- 🔁 **断点续传**: 自动跳过已上传的分片
- ⚡ **智能重试**: 分片上传失败时指数退避重试
- 🎯 **类型安全**: 完整的 TypeScript 类型定义
- 🛠️ **并发控制**: 查询并发状态,管理任务队列

## 安装

```bash
npm install pdf-craft-sdk-ts
```

## 快速开始

### 基础使用

```typescript
import { PDFCraftClient } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: 'YOUR_API_KEY' });

// 转换本地 PDF 文件
const downloadUrl = await client.convertLocalPdf('document.pdf');
console.log('下载链接:', downloadUrl);
```

### 带进度追踪的上传

```typescript
import { PDFCraftClient, UploadProgress } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: 'YOUR_API_KEY' });

const onProgress = (progress: UploadProgress) => {
    console.log(`上传进度: ${progress.percentage.toFixed(2)}%`);
    console.log(`分片: ${progress.currentPart}/${progress.totalParts}`);
};

const downloadUrl = await client.convertLocalPdf('large.pdf', {
    progressCallback: onProgress
});
```

### 批量处理

```typescript
import { PDFCraftClient, FormatType } from 'pdf-craft-sdk-ts';

const client = new PDFCraftClient({ apiKey: 'YOUR_API_KEY' });

// 创建批次
const batch = await client.createBatch([
    { url: 'cache://file1.pdf', fileName: 'doc1.pdf' },
    { url: 'cache://file2.pdf', fileName: 'doc2.pdf' }
], FormatType.Markdown);

// 启动批次
await client.startBatch(batch.batchId);

// 监控进度
const batchDetail = await client.getBatch(batch.batchId);
console.log(`进度: ${batchDetail.progress}%`);

// 获取结果
const jobs = await client.getBatchJobs(batch.batchId);
for (const job of jobs.jobs) {
    if (job.status === 'completed') {
        console.log(`${job.fileName}: ${job.resultUrl}`);
    }
}
```

## API 文档

### 初始化客户端

```typescript
// 基础初始化
const client = new PDFCraftClient({ apiKey: 'YOUR_API_KEY' });

// 使用自定义端点
const client = new PDFCraftClient({
    apiKey: 'YOUR_API_KEY',
    baseUrl: 'https://custom.api.com/v1',
    batchBaseUrl: 'https://custom.batch.com/api/v1/conversion',
    uploadBaseUrl: 'https://custom.upload.com/api/tasks/files/remote-cache'
});

// 向后兼容的方式(仅支持 apiKey 字符串)
const client = new PDFCraftClient('YOUR_API_KEY');
```

### 上传功能

#### `uploadFile(filePath, progressCallback?, maxRetries?): Promise<string>`

上传本地 PDF 文件到缓存服务器。

参数:
- `filePath`: 本地文件路径
- `progressCallback?`: 进度回调函数
- `maxRetries?`: 每个分片的最大重试次数(默认: 3)

返回: cache:// URL

```typescript
const cacheUrl = await client.uploadFile('document.pdf', (progress) => {
    console.log(`${progress.percentage}% 完成`);
});
```

#### `convertLocalPdf(filePath, options?): Promise<string>`

一步完成本地 PDF 上传和转换。

```typescript
const downloadUrl = await client.convertLocalPdf('document.pdf', {
    formatType: FormatType.EPUB,
    includesFootnotes: true,
    progressCallback: (progress) => console.log(progress.percentage)
});
```

### 转换功能

#### `convert(pdfUrl, options?): Promise<string>`

转换 PDF 文件(支持 https:// 或 cache:// URL)。

```typescript
const downloadUrl = await client.convert('https://example.com/file.pdf', {
    formatType: FormatType.Markdown,
    wait: true,  // 等待完成并返回下载 URL
    includesFootnotes: false
});
```

#### `submitConversion(pdfUrl, formatType, ...): Promise<string>`

提交转换任务,返回任务 ID。

#### `waitForCompletion(taskId, formatType?, ...): Promise<string>`

等待转换完成,返回下载 URL。

### 批处理功能

#### `createBatch(files, outputFormat?, includesFootnotes?): Promise<CreateBatchResponse>`

创建批量转换任务。

```typescript
const batch = await client.createBatch([
    { url: 'cache://abc.pdf', fileName: 'doc1.pdf', fileSize: 1024000 },
    { url: 'cache://def.pdf', fileName: 'doc2.pdf' }
], FormatType.Markdown, false);
```

#### `startBatch(batchId): Promise<OperationResponse>`

启动批次处理。

#### `getBatch(batchId): Promise<BatchDetail>`

获取批次详情。

#### `getBatches(page?, pageSize?, status?, sortBy?, sortOrder?): Promise<GetBatchesResponse>`

获取批次列表。

```typescript
const batches = await client.getBatches(1, 20, 'processing');
```

#### `getBatchJobs(batchId, page?, pageSize?, status?): Promise<GetJobsResponse>`

获取批次中的任务列表。

#### 批次控制

- `pauseBatch(batchId)`: 暂停批次
- `resumeBatch(batchId)`: 恢复批次
- `cancelBatch(batchId)`: 取消批次
- `retryJob(jobId)`: 重试单个任务
- `retryFailedJobs(batchId)`: 批量重试失败任务
- `cancelJob(jobId)`: 取消单个任务

#### `getConcurrentStatus(): Promise<ConcurrentStatus>`

获取用户并发执行状态。

```typescript
const status = await client.getConcurrentStatus();
if (status.canSubmitNewJob) {
    // 可以提交新批次
}
```

## 类型定义

### 枚举

```typescript
enum FormatType {
    Markdown = 'markdown',
    EPUB = 'epub'
}

enum PollingStrategy {
    Fixed = 1.0,
    Exponential = 1.5,
    Aggressive = 2.0
}

enum BatchStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
    Paused = 'paused'
}

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

### 接口

```typescript
interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    currentPart: number;
    totalParts: number;
    percentage: number;
}

interface BatchFile {
    url: string;
    fileName: string;
    fileSize?: number;
}

interface CreateBatchResponse {
    batchId: string;
    totalFiles: number;
    status: string;
    outputFormat: string;
    createdAt: string;
}

interface BatchDetail {
    id: string;
    userId: string;
    status: string;
    outputFormat: string;
    includesFootnotes: boolean;
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    progress: number;  // 0-100
    createdAt: string;
    updatedAt: string;
}

interface JobDetail {
    id: string;
    batchId: string;
    status: string;
    sourceUrl: string;
    fileName: string;
    resultUrl?: string;
    errorMessage?: string;
    progress?: number;
    retryCount?: number;
    // ...
}

interface ConcurrentStatus {
    maxConcurrentJobs: number;
    currentRunningJobs: number;
    canSubmitNewJob: boolean;
    availableSlots?: number;
    queuedJobs?: number;
}
```

## 错误处理

```typescript
import { APIError, TimeoutError } from 'pdf-craft-sdk-ts';

try {
    const downloadUrl = await client.convertLocalPdf('document.pdf');
} catch (error) {
    if (error instanceof APIError) {
        console.error('API 错误:', error.message);
    } else if (error instanceof TimeoutError) {
        console.error('转换超时');
    } else if (error.code === 'ENOENT') {
        console.error('文件未找到');
    }
}
```

## 完整示例

查看 `examples/demo-zh.ts` 获取完整的使用示例,包括:

1. 基础本地 PDF 转换
2. 带进度追踪的上传
3. EPUB 格式转换
4. 手动分步操作
5. 远程 PDF 转换
6. 自定义轮询策略
7. 错误处理
8. 批量处理
9. 批次控制操作
10. 并发状态查询
11. 获取批次列表

## 最佳实践

1. **上传大文件**: 始终使用进度回调来追踪上传状态
2. **批处理**: 对于多个文件,使用批处理 API 而不是逐个转换
3. **错误处理**: 始终捕获并处理错误
4. **并发控制**: 提交批次前检查并发状态
5. **重试策略**: 失败的任务可以使用 `retryFailedJobs` 批量重试

## 版本历史

### 0.4.0 (最新)
- ✨ 新增本地文件上传功能
- ✨ 新增批处理 API
- ✨ 新增上传进度追踪
- ✨ 新增并发状态查询
- ✨ 新增 `convertLocalPdf` 便捷方法
- 🔧 改进类型定义
- 📝 新增完整示例和文档

### 0.3.0
- 基础转换功能
- 远程 PDF 支持
- 轮询策略

## 许可证

MIT

## 相关链接

- [API 文档](https://docs.pdf-craft.com)
- [获取 API 密钥](https://console.oomol.com/api-key)
- [Python SDK](https://github.com/oomol/pdf-craft-sdk-py)

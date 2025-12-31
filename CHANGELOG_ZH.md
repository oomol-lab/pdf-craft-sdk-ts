# 更新日志

所有重要的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
此项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.4.0] - 2024-01-XX

### 新增

- ✨ **本地文件上传功能**
  - 新增 `uploadFile()` 方法用于上传本地 PDF 文件
  - 支持分片上传,自动处理大文件
  - 支持断点续传,跳过已上传的分片
  - 实时上传进度追踪回调
  - 智能重试机制,指数退避策略

- ✨ **批处理 API**
  - 新增 `createBatch()` 创建批量转换任务
  - 新增 `startBatch()` 启动批次处理
  - 新增 `getBatch()` 获取批次详情
  - 新增 `getBatches()` 获取批次列表(支持分页和筛选)
  - 新增 `getBatchJobs()` 获取批次中的任务列表
  - 新增批次控制方法: `pauseBatch()`, `resumeBatch()`, `cancelBatch()`
  - 新增任务管理方法: `retryJob()`, `retryFailedJobs()`, `cancelJob()`
  - 新增 `getConcurrentStatus()` 查询并发执行状态

- ✨ **便捷方法**
  - 新增 `convertLocalPdf()` 一步完成上传和转换

- 🎯 **增强的类型系统**
  - 新增 `UploadProgress` 接口
  - 新增 `InitUploadResponse` 接口
  - 新增 `BatchFile`, `CreateBatchResponse`, `BatchDetail` 接口
  - 新增 `JobDetail`, `GetJobsResponse`, `GetBatchesResponse` 接口
  - 新增 `ConcurrentStatus`, `OperationResponse` 接口
  - 新增 `ProgressCallback` 类型
  - 更新 `BatchStatus` 枚举,移除 `Draft`,新增 `Pending`

- 🔧 **客户端改进**
  - 支持新的 `PDFCraftClientOptions` 接口配置
  - 新增 `batchBaseUrl` 和 `uploadBaseUrl` 配置选项
  - 保持向后兼容,支持字符串形式的 `apiKey` 参数

### 改进

- 📝 新增完整的中文文档 (`README_ZH.md`)
- 📝 新增详细的示例代码 (`examples/demo-zh.ts`)
- 📝 所有新方法都添加了详细的 JSDoc 注释
- 🔒 改进错误处理,所有 API 方法都有完善的异常处理
- ⚡ 优化 API 响应处理,同时支持 `data` 包装格式和直接响应格式

### 技术细节

**新增的私有方法:**
- `initUpload()` - 初始化分片上传
- `uploadPart()` - 上传单个分片
- `getUploadUrl()` - 获取上传完成后的文件 URL
- `readChunk()` - 读取文件分片
- `ensureFormatType()` - 确保 formatType 是字符串格式
- `batchOperation()` - 批处理操作的通用方法

**API 端点:**
- 转换 API: `https://fusion-api.oomol.com/v1`
- 批处理 API: `https://pdf-server.oomol.com/api/v1/conversion`
- 上传 API: `https://llm.oomol.com/api/tasks/files/remote-cache`

## [0.3.0] - 2023-XX-XX

### 新增
- 基础的 PDF 转换功能
- `convert()` 高级转换方法
- `submitConversion()` 提交转换任务
- `getConversionResult()` 查询转换结果
- `waitForCompletion()` 等待转换完成
- 支持 Markdown 和 EPUB 格式
- 轮询策略配置
- 基础错误处理

### 类型
- `FormatType` 枚举
- `PollingStrategy` 枚举
- `ConversionOptions` 接口
- `APIError` 和 `TimeoutError` 异常类

## [0.2.0] - 2023-XX-XX

### 新增
- 初始版本
- 基础客户端实现

---

## 迁移指南

### 从 0.3.x 升级到 0.4.0

#### 1. 客户端初始化(可选)

如果你使用默认配置,不需要做任何更改。但现在支持更灵活的配置:

```typescript
// 旧方式(仍然支持)
const client = new PDFCraftClient('YOUR_API_KEY');

// 新方式(推荐)
const client = new PDFCraftClient({ apiKey: 'YOUR_API_KEY' });

// 使用自定义端点
const client = new PDFCraftClient({
    apiKey: 'YOUR_API_KEY',
    baseUrl: 'https://custom.api.com/v1',
    batchBaseUrl: 'https://custom.batch.com',
    uploadBaseUrl: 'https://custom.upload.com'
});
```

#### 2. 新功能使用

版本 0.4.0 新增了大量功能,但不影响现有代码。你可以选择性地使用新功能:

**本地文件上传:**
```typescript
// 直接转换本地文件
const downloadUrl = await client.convertLocalPdf('document.pdf');

// 带进度追踪
const downloadUrl = await client.convertLocalPdf('document.pdf', {
    progressCallback: (progress) => console.log(progress.percentage)
});
```

**批量处理:**
```typescript
// 创建批次
const batch = await client.createBatch([
    { url: 'cache://file1.pdf', fileName: 'doc1.pdf' }
], FormatType.Markdown);

// 启动批次
await client.startBatch(batch.batchId);

// 获取结果
const jobs = await client.getBatchJobs(batch.batchId);
```

#### 3. 类型变更

`BatchStatus` 枚举更新:
- 移除: `Draft`
- 新增: `Pending`

如果你的代码中使用了 `BatchStatus.Draft`,请替换为 `BatchStatus.Pending`。

#### 4. 无破坏性变更

所有 0.3.x 版本的 API 都保持不变,可以无缝升级。

## 已知问题

- 上传功能目前仅支持 Node.js 环境,浏览器支持将在未来版本中添加
- 批处理 API 需要服务端支持,确保你的 API 密钥有相应权限

## 即将推出

- 🌐 浏览器环境支持
- 📦 WebAssembly 加速
- 🔐 更多认证选项
- 📊 更详细的进度信息
- 🎨 自定义输出格式选项

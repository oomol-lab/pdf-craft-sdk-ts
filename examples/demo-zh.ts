/**
 * PDF Craft SDK - 使用示例
 * 演示所有主要功能的完整示例
 *
 * 从这里获取你的 API 密钥: https://console.oomol.com/api-key
 */

import {
    PDFCraftClient,
    FormatType,
    UploadProgress,
    PollingStrategy,
    BatchStatus,
    JobStatus
} from '../src';

// 请将下方替换为你从 https://console.oomol.com/api-key 获取的 API 密钥
const API_KEY = "your_api_key_here";

/**
 * 示例 1: 基础本地 PDF 转换
 */
async function example1BasicConversion() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 1: 基础本地 PDF 转换");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    // 简单的一行转换
    const downloadUrl = await client.convertLocalPdf("document.pdf");
    console.log(`✅ 转换成功! 下载链接: ${downloadUrl}`);
}

/**
 * 示例 2: 带进度追踪的上传
 */
async function example2WithProgress() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 2: 带进度追踪的上传");
    console.log("=".repeat(60));

    const onProgress = (progress: UploadProgress) => {
        console.log(`📤 上传进度: ${progress.percentage.toFixed(2)}% ` +
                    `(${progress.currentPart}/${progress.totalParts} 分片)`);
    };

    const client = new PDFCraftClient({ apiKey: API_KEY });

    const downloadUrl = await client.convertLocalPdf(
        "large_document.pdf",
        { progressCallback: onProgress }
    );
    console.log(`✅ 下载链接: ${downloadUrl}`);
}

/**
 * 示例 3: 转换为 EPUB 格式
 */
async function example3EpubConversion() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 3: 转换为 EPUB 格式");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    const downloadUrl = await client.convertLocalPdf(
        "document.pdf",
        {
            formatType: FormatType.EPUB,
            includesFootnotes: true
        }
    );
    console.log(`✅ EPUB 文件已就绪: ${downloadUrl}`);
}

/**
 * 示例 4: 手动上传和转换 (分步操作)
 */
async function example4ManualSteps() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 4: 手动上传和转换");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    // 步骤 1: 上传文件
    console.log("步骤 1: 正在上传文件...");
    const cacheUrl = await client.uploadFile("document.pdf");
    console.log(`✅ 已上传到: ${cacheUrl}`);

    // 步骤 2: 提交转换任务
    console.log("\n步骤 2: 正在提交转换任务...");
    const taskId = await client.submitConversion(
        cacheUrl,
        FormatType.Markdown
    );
    console.log(`✅ 任务 ID: ${taskId}`);

    // 步骤 3: 等待完成
    console.log("\n步骤 3: 正在等待完成...");
    const downloadUrl = await client.waitForCompletion(taskId);
    console.log(`✅ 下载链接: ${downloadUrl}`);
}

/**
 * 示例 5: 转换远程 PDF (HTTPS URL)
 */
async function example5RemotePdf() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 5: 转换远程 PDF");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    // 如果你已经有来自上传 API 的 HTTPS URL
    const pdfUrl = "https://oomol-file-cache.example.com/your-file.pdf";

    const downloadUrl = await client.convert(pdfUrl, {
        formatType: FormatType.Markdown
    });
    console.log(`✅ 下载链接: ${downloadUrl}`);
}

/**
 * 示例 6: 自定义轮询策略
 */
async function example6CustomPolling() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 6: 自定义轮询策略");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    const downloadUrl = await client.convertLocalPdf(
        "document.pdf",
        {
            checkIntervalMs: 2000,          // 初始间隔 2 秒
            maxCheckIntervalMs: 10000,      // 最大间隔 10 秒
            backoffFactor: PollingStrategy.Aggressive  // 使用激进策略
        }
    );
    console.log(`✅ 下载链接: ${downloadUrl}`);
}

/**
 * 示例 7: 正确的错误处理
 */
async function example7ErrorHandling() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 7: 错误处理");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    try {
        const downloadUrl = await client.convertLocalPdf("document.pdf");
        console.log(`✅ 成功: ${downloadUrl}`);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.error("❌ 文件未找到!");
        } else if (error.name === 'APIError') {
            console.error(`❌ API 错误: ${error.message}`);
        } else if (error.name === 'TimeoutError') {
            console.error("❌ 转换超时");
        } else {
            console.error(`❌ 发生未知错误: ${error.message}`);
        }
    }
}

/**
 * 示例 8: 批量处理多个文件
 */
async function example8BatchProcessing() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 8: 批量处理");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    // 步骤 1: 上传多个文件
    console.log("步骤 1: 上传文件...");
    const files = ["doc1.pdf", "doc2.pdf", "doc3.pdf"];
    const uploadedFiles = [];

    for (const file of files) {
        const cacheUrl = await client.uploadFile(file);
        uploadedFiles.push({
            url: cacheUrl,
            fileName: file
        });
        console.log(`✅ 已上传: ${file}`);
    }

    // 步骤 2: 创建批次
    console.log("\n步骤 2: 创建批次...");
    const batch = await client.createBatch(
        uploadedFiles,
        FormatType.Markdown,
        false
    );
    console.log(`✅ 批次已创建: ${batch.batchId}`);
    console.log(`   总文件数: ${batch.totalFiles}`);

    // 步骤 3: 启动批次
    console.log("\n步骤 3: 启动批次...");
    const startResult = await client.startBatch(batch.batchId);
    console.log(`✅ 已排队任务: ${startResult.queuedJobs}`);

    // 步骤 4: 监控进度
    console.log("\n步骤 4: 监控进度...");
    let completed = false;
    while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const batchDetail = await client.getBatch(batch.batchId);
        console.log(`📊 进度: ${batchDetail.progress}% ` +
                    `(${batchDetail.completedFiles}/${batchDetail.totalFiles})`);

        if (batchDetail.status === BatchStatus.Completed) {
            completed = true;
            console.log("✅ 批次处理完成!");
        } else if (batchDetail.status === BatchStatus.Failed) {
            console.log("❌ 批次处理失败!");
            break;
        }
    }

    // 步骤 5: 获取结果
    console.log("\n步骤 5: 获取结果...");
    const jobs = await client.getBatchJobs(batch.batchId);
    for (const job of jobs.jobs) {
        if (job.status === JobStatus.Completed) {
            console.log(`✅ ${job.fileName}: ${job.resultUrl}`);
        } else if (job.status === JobStatus.Failed) {
            console.log(`❌ ${job.fileName}: ${job.errorMessage}`);
        }
    }
}

/**
 * 示例 9: 批次控制操作
 */
async function example9BatchControl() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 9: 批次控制操作");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    const batchId = "your-batch-id";

    // 暂停批次
    console.log("暂停批次...");
    await client.pauseBatch(batchId);
    console.log("✅ 批次已暂停");

    // 恢复批次
    console.log("\n恢复批次...");
    await client.resumeBatch(batchId);
    console.log("✅ 批次已恢复");

    // 重试失败任务
    console.log("\n重试失败任务...");
    const retryResult = await client.retryFailedJobs(batchId);
    console.log(`✅ 已重试 ${retryResult.retriedJobs} 个任务`);

    // 取消批次
    console.log("\n取消批次...");
    await client.cancelBatch(batchId);
    console.log("✅ 批次已取消");
}

/**
 * 示例 10: 检查并发状态
 */
async function example10ConcurrentStatus() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 10: 并发状态");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    const status = await client.getConcurrentStatus();
    console.log(`最大并发数: ${status.maxConcurrentJobs}`);
    console.log(`当前运行任务数: ${status.currentRunningJobs}`);
    console.log(`可提交新任务: ${status.canSubmitNewJob ? '是' : '否'}`);
    console.log(`可用槽位: ${status.availableSlots}`);
    console.log(`排队任务: ${status.queuedJobs}`);

    if (status.canSubmitNewJob) {
        console.log("✅ 可以提交新的批次!");
    } else {
        console.log("⚠️  请等待当前任务完成");
    }
}

/**
 * 示例 11: 获取批次列表
 */
async function example11GetBatches() {
    console.log("\n" + "=".repeat(60));
    console.log("示例 11: 获取批次列表");
    console.log("=".repeat(60));

    const client = new PDFCraftClient({ apiKey: API_KEY });

    // 获取所有批次
    const allBatches = await client.getBatches(1, 20);
    console.log(`总批次数: ${allBatches.pagination.total}`);
    console.log(`当前页: ${allBatches.pagination.page}/${allBatches.pagination.totalPages}`);

    // 只获取处理中的批次
    const processingBatches = await client.getBatches(
        1,
        20,
        BatchStatus.Processing
    );
    console.log(`\n处理中的批次: ${processingBatches.batches.length}`);

    for (const batch of processingBatches.batches) {
        console.log(`- ${batch.id}: ${batch.progress}% 完成`);
    }
}

/**
 * 主函数 - 运行所有示例
 */
async function main() {
    console.log("PDF Craft SDK - TypeScript 示例");
    console.log("================================\n");

    try {
        // 注释掉你不想运行的示例
        // await example1BasicConversion();
        // await example2WithProgress();
        // await example3EpubConversion();
        // await example4ManualSteps();
        // await example5RemotePdf();
        // await example6CustomPolling();
        await example7ErrorHandling();
        // await example8BatchProcessing();
        // await example9BatchControl();
        // await example10ConcurrentStatus();
        // await example11GetBatches();
    } catch (error) {
        console.error("发生错误:", error);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

export {
    example1BasicConversion,
    example2WithProgress,
    example3EpubConversion,
    example4ManualSteps,
    example5RemotePdf,
    example6CustomPolling,
    example7ErrorHandling,
    example8BatchProcessing,
    example9BatchControl,
    example10ConcurrentStatus,
    example11GetBatches
};

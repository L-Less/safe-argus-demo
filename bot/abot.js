/**
 * 生成 Safe 多签交易示例
 * - 自动生成 SafeTx
 * - 可由 Bot 或其他 signer 签名/执行
 */

import {ethers} from 'ethers';
import Safe from '@safe-global/protocol-kit';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 手动读取 .env 文件（支持 UTF-16LE 编码）
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf16le');
const envLines = envContent.split('\n');

// 解析环境变量
const envVars = {};
envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            envVars[key.trim()] = value;
        }
    }
});

// 设置环境变量
Object.assign(process.env, envVars);

const {
    SEPOLIA_RPC,
    SAFE_ADDRESS,
    BOT_PRIVATE_KEY
} = process.env;

async function main() {
    if (!SEPOLIA_RPC || !SAFE_ADDRESS || !BOT_PRIVATE_KEY) {
        console.error("请检查 .env 文件，确保 SEPOLIA_RPC、SAFE_ADDRESS、BOT_PRIVATE_KEY 已设置");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    // 使用新的 Safe Protocol Kit v6 初始化方式
    const safeSdk = await Safe.init({
        provider: SEPOLIA_RPC,
        signer: BOT_PRIVATE_KEY,
        safeAddress: SAFE_ADDRESS
    });

    // 交易目标地址，可以是自己或其他测试地址
    const toAddress = wallet.address;
    const value = ethers.parseEther("0.001"); // 发送 0.001 ETH
    const data = "0x"; // 无数据调用

    // 创建 SafeTx
    const safeTransactionData = [{
        to: toAddress,
        value: value.toString(),
        data,
    }];

    const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    console.log("✅ SafeTx 已生成");
    console.log("SafeTxHash:", safeTxHash);
    console.log("交易详情:", safeTransactionData);

    // 可选择 Bot 立即签名
    await safeSdk.signTransaction(safeTransaction);
    console.log("✅ Bot 已签署交易 (EIP-712)");

    console.log("\n请通知其他 signer 通过 Safe Web 或钱包补签，达到阈值后交易即可执行。");
}

main().catch(console.error);

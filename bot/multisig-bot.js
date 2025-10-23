/**
 * 完整的多签自动化 Bot
 *
 * 流程：
 * 1. 生成交易 (由 Signer1 创建)
 * 2. Bot EIP-712 签名
 * 3. 提交到 Transaction Service
 * 4. 其他 signer 手动补签 (通过 Safe Wallet Web 页面)
 * 5. 达到阈值后 Bot 自动执行交易
 */

import {ethers} from 'ethers';
import Safe from '@safe-global/protocol-kit';
import axios from 'axios';
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
    SIGNER1,
    SIGNER2,
    SERVICE_URL,
    SAFE_THRESHOLD
} = process.env;

const threshold = Number(SAFE_THRESHOLD || 2);
const serviceUrl = SERVICE_URL || 'https://safe-transaction-sepolia.safe.global';

console.log('🤖 多签自动化 Bot 启动中...\n');

// ========== 步骤 1: 生成交易 (由 Signer1 创建) ==========
async function step1_createTransaction() {
    console.log('📝 步骤 1: 生成交易 (由 Signer1 创建)');
    console.log('='.repeat(60));

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const signer1Wallet = new ethers.Wallet(SIGNER1, provider);

    // 使用 Signer1 初始化 Safe SDK
    const safeSdk = await Safe.init({
        provider: SEPOLIA_RPC,
        signer: SIGNER1,
        safeAddress: SAFE_ADDRESS
    });

    console.log('Safe 地址:', SAFE_ADDRESS);
    console.log('Signer1 地址:', signer1Wallet.address);

    // 获取 Safe 信息
    const owners = await safeSdk.getOwners();
    const currentThreshold = await safeSdk.getThreshold();
    console.log('Safe 所有者:', owners);
    console.log('当前阈值:', currentThreshold);

    // 创建一个简单的转账交易（给 Signer1 自己转 0.001 ETH）
    const toAddress = signer1Wallet.address;
    const transferAmount = '0.001';

    const safeTransactionData = [{
        to: toAddress,
        value: ethers.parseEther(transferAmount).toString(),
        data: '0x'
    }];

    console.log(`\n💰 创建转账交易: ${transferAmount} ETH → ${toAddress}`);

    // 创建 Safe 交易
    const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);

    console.log('✅ 交易创建成功!');
    console.log('SafeTxHash:', safeTxHash);

    return {safeSdk, safeTransaction, safeTxHash, signer1Wallet};
}

// ========== 步骤 2: Bot (Signer1) EIP-712 签名 ==========
async function step2_botSign(safeSdk, safeTransaction, safeTxHash) {
    console.log('\n✍️  步骤 2: Bot (Signer1) EIP-712 签名');
    console.log('='.repeat(60));

    // Signer1 签名交易
    const signedTx = await safeSdk.signTransaction(safeTransaction);

    console.log('✅ Signer1 已签名交易');
    console.log('签名数量:', signedTx.signatures.size);
    console.log('SafeTxHash:', safeTxHash);

    return signedTx;
}

// ========== 步骤 3: 提交到 Transaction Service ==========
async function step3_proposeTransaction(safeSdk, signedTx, signer1Address) {
    console.log('\n📤 步骤 3: 提交到 Transaction Service');
    console.log('='.repeat(60));

    try {
        const safeTxHash = await safeSdk.getTransactionHash(signedTx);

        // 准备提交数据
        const proposalData = {
            to: signedTx.data.to,
            value: signedTx.data.value,
            data: signedTx.data.data,
            operation: signedTx.data.operation,
            safeTxGas: signedTx.data.safeTxGas.toString(),
            baseGas: signedTx.data.baseGas.toString(),
            gasPrice: signedTx.data.gasPrice.toString(),
            gasToken: signedTx.data.gasToken,
            refundReceiver: signedTx.data.refundReceiver,
            nonce: signedTx.data.nonce,
            contractTransactionHash: safeTxHash,
            sender: signer1Address,
            signature: signedTx.encodedSignatures(),
            origin: 'Multisig Bot'
        };

        console.log('提交数据:', JSON.stringify(proposalData, null, 2));

        // 使用 axios 直接调用 Safe Transaction Service API
        const url = `${serviceUrl}/api/v1/safes/${SAFE_ADDRESS}/multisig-transactions/`;
        const response = await axios.post(url, proposalData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ 交易已提交到 Transaction Service');
        console.log('SafeTxHash:', safeTxHash);
        console.log(`\n🌐 请访问 Safe Wallet 查看交易:`);
        console.log(`   https://app.safe.global/transactions/queue?safe=sep:${SAFE_ADDRESS}`);

        return {safeTxHash};
    } catch (error) {
        console.error('❌ 提交交易失败:', error.response?.data || error.message);
        throw error;
    }
}

// ========== 步骤 4: 等待其他 signer 手动补签 ==========
async function step4_waitForSignatures(safeTxHash) {
    console.log('\n⏳ 步骤 4: 等待其他 signer 手动补签');
    console.log('='.repeat(60));
    console.log('请通过 Safe Wallet Web 页面进行签名:');
    console.log(`https://app.safe.global/transactions/queue?safe=sep:${SAFE_ADDRESS}`);
    console.log('\n轮询检查签名状态...');

    let confirmations = 0;
    let checkCount = 0;
    const maxChecks = 120; // 最多检查 120 次 (10 分钟)

    while (confirmations < threshold && checkCount < maxChecks) {
        try {
            // 使用 axios 获取交易详情
            const url = `${serviceUrl}/api/v1/multisig-transactions/${safeTxHash}/`;
            const response = await axios.get(url);
            const transaction = response.data;

            confirmations = transaction.confirmations?.length || 0;

            console.log(`[${new Date().toLocaleTimeString()}] 当前签名数: ${confirmations}/${threshold}`);

            if (confirmations >= threshold) {
                console.log('\n✅ 已达到签名阈值!');
                return transaction;
            }

            // 等待 5 秒后再次检查
            await new Promise(resolve => setTimeout(resolve, 5000));
            checkCount++;

        } catch (error) {
            console.error('获取交易状态失败:', error.response?.data || error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
            checkCount++;
        }
    }

    if (confirmations < threshold) {
        throw new Error('等待签名超时，请手动检查 Safe Wallet');
    }
}

// ========== 步骤 5: Bot 自动执行交易 ==========
async function step5_executeTransaction(safeSdk, transaction) {
    console.log('\n🚀 步骤 5: Bot 自动执行交易');
    console.log('='.repeat(60));

    try {
        // 重新创建交易对象
        const safeTransactionData = [{
            to: transaction.to,
            value: transaction.value,
            data: transaction.data || '0x',
            operation: transaction.operation,
            safeTxGas: transaction.safeTxGas,
            baseGas: transaction.baseGas,
            gasPrice: transaction.gasPrice,
            gasToken: transaction.gasToken,
            refundReceiver: transaction.refundReceiver,
            nonce: transaction.nonce
        }];

        const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});

        // 添加所有已有的签名
        for (const confirmation of transaction.confirmations) {
            safeTransaction.addSignature({
                signer: confirmation.owner,
                data: confirmation.signature,
                staticPart: () => confirmation.signature,
                dynamicPart: () => ''
            });
        }

        console.log('执行交易中...');
        const executeTxResponse = await safeSdk.executeTransaction(safeTransaction);
        const receipt = await executeTxResponse.transactionResponse.wait();

        console.log('✅ 交易执行成功!');
        console.log('交易哈希:', receipt.hash);
        console.log('Gas 使用:', receipt.gasUsed.toString());
        console.log(`\n🔍 查看交易: https://sepolia.etherscan.io/tx/${receipt.hash}`);

        return receipt;
    } catch (error) {
        console.error('❌ 执行交易失败:', error.message);
        throw error;
    }
}

// ========== 主函数 ==========
async function main() {
    try {
        // 步骤 1: 生成交易
        const {safeSdk, safeTransaction, safeTxHash, signer1Wallet} = await step1_createTransaction();

        // 步骤 2: Bot 签名
        const signedTx = await step2_botSign(safeSdk, safeTransaction, safeTxHash);

        // 步骤 3: 提交到 Transaction Service
        const {safeTxHash: submittedHash} = await step3_proposeTransaction(safeSdk, signedTx, signer1Wallet.address);

        // 步骤 4: 等待其他 signer 手动补签
        const transaction = await step4_waitForSignatures(submittedHash);

        // 步骤 5: Bot 自动执行交易
        await step5_executeTransaction(safeSdk, transaction);

        console.log('\n🎉 完整流程执行成功!');

    } catch (error) {
        console.error('\n❌ 流程执行失败:', error);
        process.exit(1);
    }
}

// 启动
main();


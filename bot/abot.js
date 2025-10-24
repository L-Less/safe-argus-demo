/**
 * Safe 多签交易生成工具
 * - 自动生成 SafeTx
 * - 可由 Bot 或其他 signer 签名/执行
 * - 支持权限检查和授权
 */

import {ethers} from 'ethers';
import Safe from '@safe-global/protocol-kit';
import fs from 'fs';
import axios from "axios";
import SafeApiKit from "@safe-global/api-kit";

// ========== 常量定义 ==========
const AUTH_ABI = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "executor", "type": "address"}, {
        "indexed": true, "internalType": "address", "name": "target", "type": "address"
    }, {"indexed": true, "internalType": "bytes4", "name": "selector", "type": "bytes4"}, {
        "indexed": false, "internalType": "bool", "name": "allowed", "type": "bool"
    }],
    "name": "PermissionSet",
    "type": "event"
}, {
    "inputs": [{"internalType": "address", "name": "executor", "type": "address"}, {
        "internalType": "address", "name": "target", "type": "address"
    }, {"internalType": "bytes4", "name": "selector", "type": "bytes4"}, {
        "internalType": "bool", "name": "allowed", "type": "bool"
    }], "name": "setPermission", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [],
    "name": "admin",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "executor", "type": "address"}, {
        "internalType": "address", "name": "target", "type": "address"
    }, {"internalType": "bytes4", "name": "selector", "type": "bytes4"}],
    "name": "canExecute",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
}];

const DEFAULT_SELECTOR = "0x00000000";

// ========== 工具函数 ==========
/**
 * 读取并解析 .env 文件（支持 UTF-16LE 编码）
 * @param {string} envFilePath - .env 文件路径
 * @returns {Object} 环境变量对象
 */
export function loadEnvFile(envFilePath) {
    try {
        const envContent = fs.readFileSync(envFilePath, 'utf16le');
        const envLines = envContent.split('\n');
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

        return envVars;
    } catch (error) {
        throw new Error(`Failed to load .env file: ${error.message}`);
    }
}

/**
 * 验证必需的环境变量
 * @param {Object} envVars - 环境变量对象
 * @param {string[]} requiredKeys - 必需的键列表
 * @throws {Error} 如果缺少必需的环境变量
 */
export function validateEnvVars(envVars, requiredKeys) {
    const missingKeys = requiredKeys.filter(key => !envVars[key]);
    if (missingKeys.length > 0) {
        throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    }
}

/**
 * 初始化 ethers 提供者和钱包
 * @param {string} rpcUrl - RPC URL
 * @param {string} privateKey - 私钥
 * @returns {Object} { provider, wallet }
 */
export function initializeEthers(rpcUrl, privateKey) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    return {provider, wallet};
}

/**
 * 初始化 Safe SDK
 * @param {string} rpcUrl - RPC URL
 * @param {string} privateKey - 私钥
 * @param {string} safeAddress - Safe 合约地址
 * @returns {Promise<Safe>} Safe SDK 实例
 */
export async function initializeSafeSdk(rpcUrl, privateKey, safeAddress) {
    return await Safe.init({
        provider: rpcUrl, signer: privateKey, safeAddress
    });
}

/**
 * 初始化授权合约
 * @param {string} authAddress - 授权合约地址
 * @param {ethers.Wallet} wallet - 钱包实例
 * @returns {ethers.Contract} 授权合约实例
 */
export function initializeAuthContract(authAddress, wallet) {
    return new ethers.Contract(authAddress, AUTH_ABI, wallet);
}

// ========== 业务逻辑函数 ==========
/**
 * 检查机器人执行权限
 * @param {ethers.Contract} authorizer - 授权合约实例
 * @param {string} executorAddress - 执行者地址
 * @param {string} targetAddress - 目标地址
 * @param {string} selector - 函数选择器
 * @returns {Promise<boolean>} 是否有权限
 */
export async function checkPermission(authorizer, executorAddress, targetAddress, selector = DEFAULT_SELECTOR) {
    try {
        const canExec = await authorizer.canExecute(executorAddress, targetAddress, selector);
        return canExec;
    } catch (error) {
        console.error("⚠️ 权限检查失败:", error.message);
        return false;
    }
}

/**
 * 授予机器人执行权限
 * @param {ethers.Contract} authorizer - 授权合约实例
 * @param {string} executorAddress - 执行者地址
 * @param {string} targetAddress - 目标地址
 * @param {string} selector - 函数选择器
 * @returns {Promise<Object>} 交易收据
 */
export async function grantPermission(authorizer, executorAddress, targetAddress, selector = DEFAULT_SELECTOR) {
    const tx = await authorizer.setPermission(executorAddress, targetAddress, selector, true);
    const receipt = await tx.wait();
    return receipt;
}

/**
 * 获取 Safe 合约余额
 * @param {ethers.Provider} provider - ethers 提供者
 * @param {string} safeAddress - Safe 合约地址
 * @returns {Promise<string>} 余额（ETH）
 */
export async function getSafeBalance(provider, safeAddress) {
    const balance = await provider.getBalance(safeAddress);
    return ethers.formatEther(balance);
}

/**
 * 获取 Safe 合约配置
 * @param {Safe} safeSdk - Safe SDK 实例
 * @returns {Promise<Object>} { owners, threshold }
 */
export async function getSafeConfig(safeSdk) {
    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const nonce = await safeSdk.getNonce();
    return {owners, threshold, nonce};
}

/**
 * 创建 Safe 交易
 * @param {Safe} safeSdk - Safe SDK 实例
 * @param {string} toAddress - 目标地址
 * @param {string} value - 转账金额（wei）
 * @param {string} data - 交易数据
 * @returns {Promise<Object>} Safe 交易对象
 */
export async function createSafeTransaction(safeSdk, toAddress, value, data = "0x") {
    const safeTransactionData = [{
        to: toAddress, value: value.toString(), data
    }];

    const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});
    return safeTransaction;
}

/**
 * 获取 Safe 交易哈希
 * @param {Safe} safeSdk - Safe SDK 实例
 * @param {Object} safeTransaction - Safe 交易对象
 * @returns {Promise<string>} 交易哈希
 */
export async function getSafeTransactionHash(safeSdk, safeTransaction) {
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    return safeTxHash;
}

/**
 * 签名 Safe 交易
 * @param {Safe} safeSdk - Safe SDK 实例
 * @param {Object} safeTransaction - Safe 交易对象
 * @returns {Promise<Object>} 已签名的交易
 */
export async function signSafeTransaction(safeSdk, safeTransaction) {
    const signedTx = await safeSdk.signTransaction(safeTransaction);
    return signedTx;
}

// ========== 主流程 ==========
/**
 * 主函数：执行完整的 Safe 交易生成流程
 * @param {Object} config - 配置对象
 * @param {string} config.rpcUrl - RPC URL
 * @param {string} config.safeAddress - Safe 合约地址
 * @param {string} config.botPrivateKey - Bot 私钥
 * @param {string} config.authAddress - 授权合约地址
 * @param {string} config.toAddress - 转账目标地址
 * @param {string} config.amount - 转账金额（ETH）
 * @returns {Promise<Object>} 执行结果
 */
export async function executeSafeTransactionFlow(config) {
    const {
        rpcUrl, safeAddress, botPrivateKey, authAddress, toAddress, amount = "0.001"
    } = config;

    // 1. 初始化
    console.log("🚀 初始化 Safe 交易流程...\n");
    const {provider, wallet} = initializeEthers(rpcUrl, botPrivateKey);
    const safeSdk = await initializeSafeSdk(rpcUrl, botPrivateKey, safeAddress);
    const authorizer = initializeAuthContract(authAddress, wallet);

    console.log("✅ 初始化完成");
    console.log("  - Bot 地址:", wallet.address);
    console.log("  - Safe 地址:", safeAddress);
    console.log("  - 授权合约:", authAddress);
    console.log();

    // 2. 检查权限
    console.log("🔍 检查机器人执行权限...");
    const hasPermission = await checkPermission(authorizer, wallet.address, safeAddress);
    console.log("  - 权限状态:", hasPermission ? "✅ 已授权" : "❌ 未授权");
    console.log();

    // 3. 如果没有权限，尝试授权
    if (!hasPermission) {
        console.log("🔐 尝试授予权限...");
        try {
            await grantPermission(authorizer, wallet.address, safeAddress);
            console.log("  - ✅ 权限授予成功");
        } catch (error) {
            console.log("  - ⚠️ 权限授予失败:", error.message);
        }
        console.log();
    }

    // 4. 显示余额信息
    console.log("💰 查询 Safe 余额...");
    const balance = await getSafeBalance(provider, safeAddress);
    console.log("  - Safe 余额:", balance, "ETH");
    console.log();

    // 5. 检查 Safe 配置
    console.log("⚙️  查询 Safe 配置...");
    const {owners, threshold, nonce} = await getSafeConfig(safeSdk);
    console.log("  - 所有者:", owners);
    console.log("  - 签名阈值:", threshold);
    console.log("  当前 nonce:", nonce);
    console.log();

    // 6. 创建交易
    console.log("📝 创建 Safe 交易...");
    const value = ethers.parseEther(amount);
    const safeTransaction = await createSafeTransaction(safeSdk, toAddress, value);
    const safeTxHash = await getSafeTransactionHash(safeSdk, safeTransaction);
    console.log("  - ✅ 交易创建成功");
    console.log("  - SafeTxHash:", safeTxHash);
    console.log("  - 目标地址:", toAddress);
    console.log("  - 转账金额:", amount, "ETH");
    console.log();


    // bot 是 其中一个 singer 所以 可以  签名交易
    const signedTx = await signSafeTransaction(safeSdk, safeTransaction)

    console.log('bot 是 其中一个 singer  已签名交易');
    console.log('签名数量:', signedTx.signatures.size);
    console.log('签名者地址:', Array.from(signedTx.signatures.keys()));
    console.log('SafeTxHash:', safeTxHash);

    // 构造 POST payload - 使用 Safe 所有者作为发送者
    const ownerSender = owners[0]; // 使用第一个所有者作为发送者
    console.log('👤 使用 Safe 所有者作为发送者:', ownerSender);

    const proposalData = {
        to: ethers.getAddress(signedTx.data.to), // 确保地址格式正确
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
        sender: ethers.getAddress(ownerSender),
        signature: signedTx.encodedSignatures()
        // 移除 origin 字段，可能不被支持
    };

    // 提交到 Transaction Service - 使用正确的端点
    const url = `https://safe-transaction-sepolia.safe.global/api/v1/safes/${safeAddress}/multisig-transactions/`;
    console.log('🌐 API URL:', url);

    console.log('提交数据:', JSON.stringify(proposalData, null, 2));

    try {
        // 使用 axios 直接调用 Safe Transaction Service API
        const response = await axios.post(url, proposalData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ 交易已提交到 Transaction Service');
        console.log('📊 响应状态:', response.status);
        console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
        console.log('SafeTxHash:', safeTxHash);

        // 立即验证交易是否真的被创建
        const service = new SafeApiKit({
            txServiceUrl: "https://safe-transaction-sepolia.safe.global",
            chainId: 11155111n
        });

        console.log('\n🔍 验证交易是否真的被创建...');
        try {
            const verifyUrl = `https://safe-transaction-sepolia.safe.global/api/v1/safes/${safeAddress}/multisig-transactions/`;
            const verifyResponse = await axios.get(verifyUrl, {
                headers: {'Accept': 'application/json'},
                timeout: 10000
            });

            console.log('📋 Safe 中的待处理交易数量:', verifyResponse.data.results?.length || 0);
            if (verifyResponse.data.results && verifyResponse.data.results.length > 0) {
                const latestTx = verifyResponse.data.results[0];
                console.log('📝 最新的交易:');
                console.log('  - SafeTxHash:', latestTx.safeTxHash);
                console.log('  - 状态:', latestTx.isExecuted ? '已执行' : '待签名');
                console.log('  - 签名数量:', latestTx.confirmations?.length || 0);
                console.log('  - 目标地址:', latestTx.to);
                console.log('  - 转账金额:', latestTx.value);

                if (latestTx.safeTxHash === safeTxHash) {
                    console.log('✅ 交易确认已创建！');

                    // 如果交易确认已创建，开始等待其他签名者
                    console.log('\n🔄 开始等待其他签名者补签...');
                    try {
                        const finalTransaction = await waitForSignatures(safeTxHash, safeAddress, threshold);
                        console.log('🎉 交易已达到签名阈值，可以执行！');
                        console.log('📋 最终交易详情:', JSON.stringify(finalTransaction, null, 2));

                        // 显示签名详情
                        console.log('\n🎯 交易已达到签名阈值，可以执行！');
                        console.log('📋 签名详情:');
                        finalTransaction.confirmations?.forEach((confirmation, index) => {
                            console.log(`  ${index + 1}. 签名者: ${confirmation.owner}`);
                            console.log(`     签名: ${confirmation.signature}`);
                        });


                        // 构建完整的签名交易
                        console.log('\n🔧 构建完整签名交易...');
                        try {
                            // const completeSignedTx = await buildCompleteSignedTransaction(safeSdk, finalTransaction);
                            // console.log('✅ 完整签名交易构建成功');

                            // 从服务重新获取完整交易体
                            const safeTx = await service.getTransaction(safeTxHash)

                            // 自动执行交易
                            console.log('\n🚀 自动执行交易...');
                            const executeResult = await executeSafeTransaction(safeSdk, safeTx);
                            console.log('🎉 交易执行成功！');
                            console.log('📋 执行结果:', JSON.stringify(executeResult, null, 2));

                        } catch (buildError) {
                            console.error('❌ 构建完整交易失败:', buildError.message);
                            console.log('\n💡 降级到手动执行:');
                            console.log(`   https://app.safe.global/transactions/queue?safe=sep:${safeAddress}`);
                        }
                    } catch (waitError) {
                        console.log('⏰ 等待签名超时或失败:', waitError.message);
                        console.log('💡 请手动在 Safe Web 界面检查交易状态');
                    }
                } else {
                    console.log('⚠️ 交易哈希不匹配，可能创建了不同的交易');
                }
            } else {
                console.log('❌ 没有找到待处理的交易 - 交易可能没有成功创建');
            }
        } catch (verifyError) {
            console.log('⚠️ 无法验证交易状态:', verifyError.message);
        }

    } catch (error) {
        console.error('❌ 提交失败:', error.message);
        if (error.response) {
            console.log('🔍 HTTP 状态:', error.response.status);
            console.log('🔍 错误详情:', JSON.stringify(error.response.data, null, 2));

            // 分析具体的错误信息
            if (error.response.data && typeof error.response.data === 'object') {
                console.log('\n📝 错误分析:');
                Object.keys(error.response.data).forEach(key => {
                    console.log(`  - ${key}:`, error.response.data[key]);
                });
            }
        }

        // 尝试备选方案
        console.log('\n🔄 尝试备选方案...');
        try {
            const alternativeData = {
                to: ethers.getAddress(signedTx.data.to),
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
                sender: ethers.getAddress(ownerSender)
                // 不包含签名字段，让 Safe Web 处理
            };

            console.log('📤 备选方案数据:', JSON.stringify(alternativeData, null, 2));

            const altResponse = await axios.post(url, alternativeData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ 备选方案成功!');
            console.log('📊 响应状态:', altResponse.status);
            console.log('📋 响应数据:', JSON.stringify(altResponse.data, null, 2));

        } catch (altError) {
            console.error('❌ 备选方案也失败:', altError.message);
            if (altError.response) {
                console.log('🔍 备选方案错误详情:', JSON.stringify(altError.response.data, null, 2));
            }
        }
    }

    console.log(`\n🌐 请访问 Safe Wallet 查看交易:`);
    console.log(`   https://app.safe.global/transactions/queue?safe=sep:${safeAddress}`);

    return {
        safeTxHash, signedTx, threshold, currentSignatures: signedTx.signatures.size
    };
}

/**
 * 执行 Safe 交易
 * @param {Safe} safeSdk - Safe SDK 实例
 * @param {Object} transactionData - 交易数据（可以是已签名交易或从 API 获取的数据）
 * @returns {Promise<Object>} 执行结果
 */
export async function executeSafeTransaction(safeSdk, transactionData) {
    console.log('🎯 开始执行 Safe 交易...');

    try {
        // 检查是否是 Safe SDK 格式的交易对象
        if (transactionData.data && transactionData.signatures) {
            // 这是 Safe SDK 格式的交易对象
            console.log('📝 使用 Safe SDK 格式的交易对象');
            const executeResponse = await safeSdk.executeTransaction(transactionData);
            console.log('✅ 交易执行成功!');
            console.log('📋 执行结果:', JSON.stringify(executeResponse, null, 2));
            return executeResponse;
        } else {
            // 这是从 API 获取的原始数据，需要重新构建交易
            console.log('📝 从 API 数据重新构建交易...');
            console.log('⚠️ 注意：需要所有签名者的签名才能执行');
            console.log('💡 建议手动在 Safe Web 界面执行交易');

            // 这里我们不能直接执行，因为缺少完整的签名信息
            throw new Error('无法自动执行：缺少完整的签名信息。请手动在 Safe Web 界面执行交易。');
        }
    } catch (error) {
        console.error('❌ 交易执行失败:', error.message);
        throw error;
    }
}

/**
 * 构建完整的签名交易
 * @param {Object} safeSdk - Safe SDK 实例
 * @param {Object} transactionData - 从 Safe Transaction Service 获取的交易数据
 * @returns {Promise<Object>} 完整的签名交易对象
 */
export async function buildCompleteSignedTransaction(safeSdk, transactionData) {
    console.log('🔧 开始构建完整签名交易...');

    try {
        console.log('🔍 开始处理交易数据...');
        console.log('🔍 transactionData 类型:', typeof transactionData);
        console.log('🔍 transactionData 键:', Object.keys(transactionData || {}));

        // 从 Safe Transaction Service 获取的交易数据
        const {to, value, data, operation, nonce, confirmations} = transactionData;

        console.log('📋 交易参数:');
        console.log(`  to: ${to}`);
        console.log(`  value: ${value}`);
        console.log(`  data: ${data}`);
        console.log(`  operation: ${operation}`);
        console.log(`  nonce: ${nonce}`);
        console.log(`  confirmations 类型: ${typeof confirmations}`);
        console.log(`  confirmations 是否为数组: ${Array.isArray(confirmations)}`);
        console.log(`  确认数: ${confirmations?.length || 0}`);

        // 验证必要的数据
        if (!to) {
            throw new Error('缺少目标地址 (to)');
        }
        if (nonce === undefined) {
            throw new Error('缺少 nonce');
        }

        console.log('🔍 原始交易数据:', JSON.stringify(transactionData, null, 2));

        // 创建 Safe 交易对象
        const safeTransaction = await safeSdk.createTransaction({
            to: to,
            value: value || '0',
            data: data || '0x',
            operation: operation || 0
        });

        console.log('✅ Safe 交易对象创建成功');

        // 添加所有签名
        console.log('🔍 检查 confirmations 数据...');
        console.log('🔍 confirmations 存在:', !!confirmations);
        console.log('🔍 confirmations 类型:', typeof confirmations);
        console.log('🔍 confirmations 是否为数组:', Array.isArray(confirmations));

        if (confirmations && Array.isArray(confirmations) && confirmations.length > 0) {
            console.log('🔐 添加所有签名...');
            console.log(`📋 找到 ${confirmations.length} 个确认`);

            for (let i = 0; i < confirmations.length; i++) {
                const confirmation = confirmations[i];
                console.log(`  处理第 ${i + 1} 个确认:`, JSON.stringify(confirmation, null, 2));

                if (!confirmation || !confirmation.owner || !confirmation.signature) {
                    console.warn(`  ⚠️ 跳过无效的确认 ${i + 1}:`, confirmation);
                    continue;
                }

                const {owner, signature} = confirmation;
                console.log(`  添加签名者 ${owner} 的签名`);

                try {
                    // 将签名添加到交易中
                    safeTransaction.addSignature({
                        signer: owner,
                        signature: signature
                    });
                    console.log(`  ✅ 成功添加签名者 ${owner} 的签名`);
                } catch (signatureError) {
                    console.error(`  ❌ 添加签名失败 (${owner}):`, signatureError.message);
                    // 继续处理其他签名
                }
            }

            console.log(`✅ 已处理 ${confirmations.length} 个确认`);
        } else {
            console.log('⚠️ 没有找到有效的确认数据');
            console.log('🔍 confirmations 类型:', typeof confirmations);
            console.log('🔍 confirmations 值:', confirmations);
            console.log('🔍 confirmations 长度:', confirmations?.length);
        }

        return safeTransaction;

    } catch (error) {
        console.error('❌ 构建完整签名交易失败:', error.message);
        throw error;
    }
}

/**
 * 等待其他签名者补签交易
 * @param {string} safeTxHash - Safe 交易哈希
 * @param {string} safeAddress - Safe 合约地址
 * @param {number} threshold - 签名阈值
 * @param {string} serviceUrl - Safe Transaction Service URL
 * @returns {Promise<Object>} 交易详情
 */
export async function waitForSignatures(safeTxHash, safeAddress, threshold, serviceUrl = "https://safe-transaction-sepolia.safe.global") {
    console.log('等待其他 signer 手动补签');
    console.log('='.repeat(60));
    console.log('请通过 Safe Wallet Web 页面进行签名:');
    console.log(`https://app.safe.global/transactions/queue?safe=sep:${safeAddress}`);
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
                console.log('🚀 准备自动执行交易...');
                console.log('📋 收集到的签名信息:', transaction.confirmations);
                console.log('🔍 完整交易数据:', JSON.stringify(transaction, null, 2));
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

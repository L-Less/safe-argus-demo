import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 手动读取 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf16le');
const envLines = envContent.split('\n');

// 解析环境变量
const envVars = {};
envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

// 设置环境变量
Object.assign(process.env, envVars);

// 环境变量配置
const SEPOLIA_RPC = process.env.SEPOLIA_RPC;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const AUTH_ADDRESS = process.env.AUTH_ADDRESS;
const SIGNER1 = process.env.SIGNER1;
const SIGNER2 = process.env.SIGNER2;

// 验证必要的环境变量
if (!SEPOLIA_RPC || !BOT_PRIVATE_KEY || !SAFE_ADDRESS || !AUTH_ADDRESS || !SIGNER1 || !SIGNER2) {
    console.error('❌ 缺少必要的环境变量，请检查 .env 文件');
    process.exit(1);
}

// Provider (ethers v6 syntax)
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

// Wallets
const botWallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
const signer1Wallet = new ethers.Wallet(SIGNER1, provider);
const signer2Wallet = new ethers.Wallet(SIGNER2, provider);

// 使用标准的 Safe 合约 ABI (v1.3.0)
const SAFE_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "value", "type": "uint256"},
            {"internalType": "bytes", "name": "data", "type": "bytes"},
            {"internalType": "uint8", "name": "operation", "type": "uint8"},
            {"internalType": "uint256", "name": "safeTxGas", "type": "uint256"},
            {"internalType": "uint256", "name": "baseGas", "type": "uint256"},
            {"internalType": "uint256", "name": "gasPrice", "type": "uint256"},
            {"internalType": "address", "name": "gasToken", "type": "address"},
            {"internalType": "address", "name": "refundReceiver", "type": "address"},
            {"internalType": "bytes", "name": "signatures", "type": "bytes"}
        ],
        "name": "execTransaction",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "value", "type": "uint256"},
            {"internalType": "bytes", "name": "data", "type": "bytes"},
            {"internalType": "uint8", "name": "operation", "type": "uint8"},
            {"internalType": "uint256", "name": "safeTxGas", "type": "uint256"},
            {"internalType": "uint256", "name": "baseGas", "type": "uint256"},
            {"internalType": "uint256", "name": "gasPrice", "type": "uint256"},
            {"internalType": "address", "name": "gasToken", "type": "address"},
            {"internalType": "address", "name": "refundReceiver", "type": "address"},
            {"internalType": "uint256", "name": "nonce", "type": "uint256"}
        ],
        "name": "getTransactionHash",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nonce",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOwners",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getThreshold",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "owner", "type": "address"}
        ],
        "name": "isOwner",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {"stateMutability": "payable", "type": "fallback"}
];
const AUTH_ABI = [
    {"inputs": [], "stateMutability": "nonpayable", "type": "constructor"},

    {
        "anonymous": false, "inputs": [
            {"indexed": true, "internalType": "address", "name": "executor", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "target", "type": "address"},
            {"indexed": true, "internalType": "bytes4", "name": "selector", "type": "bytes4"},
            {"indexed": false, "internalType": "bool", "name": "allowed", "type": "bool"}
        ], "name": "PermissionSet", "type": "event"
    },

    {
        "inputs": [
            {"internalType": "address", "name": "executor", "type": "address"},
            {"internalType": "address", "name": "target", "type": "address"},
            {"internalType": "bytes4", "name": "selector", "type": "bytes4"},
            {"internalType": "bool", "name": "allowed", "type": "bool"}
        ], "name": "setPermission", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },

    {
        "inputs": [], "name": "admin", "outputs": [
            {"internalType": "address", "name": "", "type": "address"}
        ], "stateMutability": "view", "type": "function"
    },

    {
        "inputs": [
            {"internalType": "address", "name": "executor", "type": "address"},
            {"internalType": "address", "name": "target", "type": "address"},
            {"internalType": "bytes4", "name": "selector", "type": "bytes4"}
        ], "name": "canExecute", "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ], "stateMutability": "view", "type": "function"
    }
];

const safe = new ethers.Contract(SAFE_ADDRESS, SAFE_ABI, botWallet);
const authorizer = new ethers.Contract(AUTH_ADDRESS, AUTH_ABI, botWallet);

// === 1️⃣ 检查权限函数 ===
async function checkPermission() {
    console.log("🔍 检查机器人执行权限...");
    const selector = "0x00000000";
    const canExec = await authorizer.canExecute(botWallet.address, SAFE_ADDRESS, selector);
    console.log("权限检查结果:", canExec);
    return canExec;
}

// === 2️⃣ 授权函数 ===
async function grantPermission() {
    console.log("🚫 当前机器人没有执行权限，尝试授权...");
    const selector = "0x00000000";
    const tx = await authorizer.setPermission(botWallet.address, SAFE_ADDRESS, selector, true);
    await tx.wait();
    console.log("✅ 已设置权限");
}

// === 3️⃣ 检查 Safe 合约配置函数 ===
async function checkSafeConfig() {
    console.log("🔍 检查 Safe 合约配置...");
    const safeContract = new ethers.Contract(SAFE_ADDRESS, SAFE_ABI, signer1Wallet);
    
    try {
        const owners = await safeContract.getOwners();
        const threshold = await safeContract.getThreshold();
        
        console.log("👥 Safe 合约所有者:", owners);
        console.log("🔢 签名阈值:", threshold.toString());
        console.log("📊 签名者1地址:", signer1Wallet.address);
        console.log("📊 签名者2地址:", signer2Wallet.address);
        
        // 检查签名者是否是所有者
        const isSigner1Owner = owners.includes(signer1Wallet.address);
        const isSigner2Owner = owners.includes(signer2Wallet.address);
        
        console.log("✅ 签名者1是所有者:", isSigner1Owner);
        console.log("✅ 签名者2是所有者:", isSigner2Owner);
        
        if (!isSigner1Owner || !isSigner2Owner) {
            console.log("❌ 签名者不是 Safe 合约的所有者，无法执行交易");
            return false;
        }
        
        if (threshold > 2) {
            console.log("❌ 签名阈值大于2，需要更多签名");
            return false;
        }
        
        return true;
    } catch (error) {
        console.log("⚠️ 无法获取 Safe 合约配置:", error.message);
        return false;
    }
}

// === 4️⃣ 构造交易函数 ===
async function buildTransaction() {
    console.log("🔨 构造交易...");
    
    // 转账参数
    const toAddress = "0x56c0dacc4088e01da5afa2e8511dfb4367d495b7"; // 收款地址
    const transferAmount = ethers.parseEther("0.001"); // 转账金额 0.001 ETH
    const DATA = "0x"; // 普通转账，无 data
    
    console.log("📤 收款地址:", toAddress);
    console.log("💰 转账金额:", ethers.formatEther(transferAmount), "ETH");
    
    // 创建 Safe 合约实例
    const safeContract = new ethers.Contract(SAFE_ADDRESS, SAFE_ABI, signer1Wallet);
    
    // 获取当前 nonce
    const nonce = await safeContract.nonce();
    console.log("🔢 当前 nonce:", nonce.toString());

    const OPERATION = 0;
    const SAFE_TX_GAS = 0n;
    const BASE_GAS = 0n;
    const GAS_PRICE = 0n;
    const GAS_TOKEN = ethers.ZeroAddress;
    const REFUND_RECEIVER = ethers.ZeroAddress;

    const txHash = await safeContract.getTransactionHash(
        toAddress,
        transferAmount,
        DATA,
        OPERATION,
        SAFE_TX_GAS,
        BASE_GAS,
        GAS_PRICE,
        GAS_TOKEN,
        REFUND_RECEIVER,
        nonce
    );


    console.log("📝 交易哈希:", txHash);
    
    return {
        safeContract,
        toAddress,
        transferAmount,
        txHash
    };
}

// === 5️⃣ 创建多签签名函数 ===
async function createMultiSigSignatures(txHash) {
    console.log("🔍 使用两个签名者进行多签...");

    console.log("🔐 签名者1地址:", signer1Wallet.address);
    console.log("🔐 签名者2地址:", signer2Wallet.address);

    // 使用原始 32 字节交易哈希进行签名（不加以太坊消息前缀）
    const digestBytes = ethers.getBytes(txHash);

    const sigObj1 = signer1Wallet.signingKey.sign(digestBytes);
    const sigObj2 = signer2Wallet.signingKey.sign(digestBytes);

    const sigHex1 = ethers.Signature.from(sigObj1).serialized;
    const sigHex2 = ethers.Signature.from(sigObj2).serialized;

    console.log("✍️ 签名者1签名完成");
    console.log("✍️ 签名者2签名完成");

    // 用 recoverAddress 基于原始 digest 恢复地址
    const owner1 = ethers.recoverAddress(txHash, sigHex1).toLowerCase();
    const owner2 = ethers.recoverAddress(txHash, sigHex2).toLowerCase();

    console.log("✅ 验证签名1所有者:", owner1);
    console.log("✅ 验证签名2所有者:", owner2);

    // 按地址排序签名（从小到大）
    const ordered = owner1 <= owner2 ? [sigHex1, sigHex2] : [sigHex2, sigHex1];

    // 仅拼接 r||s||v（每个 65 字节）
    const signatures = "0x" + ordered.map(s => s.slice(2)).join("");
    console.log("🔗 组合签名完成，签名长度:", signatures.length);

    return signatures;
}

// === 6️⃣ 执行多签交易函数 ===
async function executeMultiSigTransaction(safeContract, toAddress, transferAmount, signatures) {
    console.log("🚀 执行多签交易...");

    const data = "0x"; // 无数据调用
    const operation = 0; // CALL
    const safeTxGas = 0n;
    const baseGas = 0n;
    const gasPrice = 0n;
    const gasToken = ethers.ZeroAddress;
    const refundReceiver = ethers.ZeroAddress;

    let gasEstimate;

    try {
        gasEstimate = await safeContract.execTransaction.estimateGas(
            toAddress,
            transferAmount,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            signatures
        );
        console.log(`✅ Gas estimate: ${gasEstimate}`);
    } catch (e) {
        console.warn("⚠️ estimateGas failed, using fallback 250000");
        gasEstimate = 250000n;
    }


    const tx = await safeContract.execTransaction(
        toAddress,
        transferAmount,
        "0x", // 空数据
        0,    // CALL 操作
        0,    // safeTxGas
        0,    // baseGas
        0,    // gasPrice
        ethers.ZeroAddress, // gasToken
        ethers.ZeroAddress, // refundReceiver
        signatures,
        { gasLimit: gasEstimate }
    );

    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();
    console.log("✅ ETH 转账成功！");
    console.log("📋 交易哈希:", receipt.hash);
    console.log("⛽ Gas 使用量:", receipt.gasUsed.toString());
    
    return receipt;
}

// === 7️⃣ 显示余额信息函数 ===
async function displayBalanceInfo() {
    console.log("📊 签名者1地址:", signer1Wallet.address);
    console.log("📊 签名者2地址:", signer2Wallet.address);
    
    // 获取余额信息
    const safeBalance = await provider.getBalance(SAFE_ADDRESS);
    console.log("🏦 Safe 合约余额:", ethers.formatEther(safeBalance), "ETH");
}

// === 8️⃣ 主函数 ===
async function runBot() {
    console.log("🤖 Bot running...");

    try {
        // 1. 检查权限
        const hasPermission = await checkPermission();
        
        // 2. 如果没有权限，尝试授权
        if (!hasPermission) {
            await grantPermission();
        }
        
        console.log("✅ 机器人权限检查通过！");
        
        // 3. 显示余额信息
        await displayBalanceInfo();
        
        // 4. 检查 Safe 合约配置
        const safeConfigValid = await checkSafeConfig();
        if (!safeConfigValid) {
            console.log("❌ Safe 合约配置检查失败，停止执行");
            return;
        }
        
        // 5. 构造交易
        const transactionData = await buildTransaction();
        
        // 6. 创建多签签名
        const orderedSignatures = await createMultiSigSignatures(transactionData.txHash);


        // 7. 执行多签交易
        await executeMultiSigTransaction(
            transactionData.safeContract,
            transactionData.toAddress,
            transactionData.transferAmount,
            orderedSignatures
        );
        
    } catch (error) {
        console.error("❌ 执行过程中发生错误:", error.message);
    }

    // 8. 定时循环
    // setTimeout(runBot, 1 * 60 * 1000);
}

// 启动机器人
runBot().catch(console.error);
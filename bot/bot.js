import {ethers} from 'ethers';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

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


// 使用更完整的 Safe 合约 ABI
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


async function runBot() {
    console.log("🤖 Bot running...");

    // === 1️⃣ 定义自动执行目标 ===
    const selector = "0x00000000";

    // === 2️⃣ 检查是否有执行权限 ===
    const canExec = await authorizer.canExecute(botWallet.address, SAFE_ADDRESS, selector);
    console.log("权限检查:", canExec);

    if (!canExec) {
        console.log("🚫 当前机器人没有执行权限，尝试授权...");
        // 调用管理员钱包授权（这里假设botWallet有权）
        const tx = await authorizer.setPermission(botWallet.address, SAFE_ADDRESS, selector, true);
        await tx.wait();
        console.log("✅ 已设置权限");
    }

    // === 3️⃣ Safe 合约 ETH 转账 ===
    console.log("✅ 机器人权限检查通过！");
    console.log("📊 签名者1地址:", signer1Wallet.address);
    console.log("📊 签名者2地址:", signer2Wallet.address);
    
    // 获取余额信息
    const safeBalance = await provider.getBalance(SAFE_ADDRESS);
    console.log("🏦 Safe 合约余额:", ethers.formatEther(safeBalance), "ETH");
    
    // 转账参数
    const toAddress = "0x56c0dacc4088e01da5afa2e8511dfb4367d495b7"; // 收款地址
    const transferAmount = ethers.parseEther("0.001"); // 转账金额 0.001 ETH
    
    console.log("🚀 准备执行 ETH 转账...");
    console.log("📤 收款地址:", toAddress);
    console.log("💰 转账金额:", ethers.formatEther(transferAmount), "ETH");
    
    // 创建 Safe 合约实例（使用第一个签名者）
    const safeContract = new ethers.Contract(SAFE_ADDRESS, SAFE_ABI, signer1Wallet);
    
    // 获取当前 nonce
    const nonce = await safeContract.nonce();
    console.log("🔢 当前 nonce:", nonce.toString());
    
    // 检查 Safe 合约配置
    console.log("🔍 检查 Safe 合约配置...");
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
            return;
        }
        
        if (threshold > 2) {
            console.log("❌ 签名阈值大于2，需要更多签名");
            return;
        }
        
    } catch (error) {
        console.log("⚠️ 无法获取 Safe 合约配置:", error.message);
    }
    
    // 获取交易哈希
    const txHash = await safeContract.getTransactionHash(
        toAddress,
        transferAmount,
        "0x", // 空数据（ETH 转账）
        0,    // CALL 操作
        0,    // safeTxGas
        0,    // baseGas
        0,    // gasPrice
        ethers.ZeroAddress, // gasToken
        ethers.ZeroAddress, // refundReceiver
        nonce
    );
    
    console.log("📝 交易哈希:", txHash);
    
    // 使用两个签名者（阈值是2）
    console.log("🔍 使用两个签名者进行多签...");
    
    // 使用 signMessage 的另一种方法
    // Safe 合约可能需要特定的签名格式
    const signature1 = await signer1Wallet.signMessage(ethers.getBytes(txHash));
    console.log("✍️ 签名者1签名完成");
    
    const signature2 = await signer2Wallet.signMessage(ethers.getBytes(txHash));
    console.log("✍️ 签名者2签名完成");
    
    console.log("🔍 签名1:", signature1);
    console.log("🔍 签名2:", signature2);
    
    // 尝试更简单的签名格式
    // 直接使用原始签名，让 Safe 合约自己处理
    console.log("🔍 尝试使用原始签名格式...");
    
    // 组合签名（简单的连接）
    const signatures = signature1 + signature2.slice(2); // 移除第二个签名的 0x 前缀

    // 执行交易
    console.log("🚀 执行多签交易...");
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
        signatures
    );
    
    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();
    console.log("✅ ETH 转账成功！");
    console.log("📋 交易哈希:", receipt.hash);
    console.log("⛽ Gas 使用量:", receipt.gasUsed.toString());

    // === 5️⃣ 定时或事件循环逻辑（夜间自动执行）===
    // 例如每隔 10 分钟检查一次
    setTimeout(runBot, 1 * 60 * 1000);
}

// 启动机器人
runBot().catch(console.error);
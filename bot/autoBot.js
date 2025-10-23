/**
 * 自动化多签 Bot (ES Module)
 * - 支持自定义 signer
 * - Bot 自动轮询签名
 * - 使用 Safe SDK EIP-712 签名
 * - 阈值达到自动执行交易
 */

import axios from 'axios';
import {ethers} from 'ethers';
import Safe from '@safe-global/protocol-kit';
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

const {
    SEPOLIA_RPC,
    SAFE_ADDRESS,
    BOT_PRIVATE_KEY,
    AUTH_ADDRESS,
    SAFE_THRESHOLD,
    SIGNERS,
    SERVICE_URL,
    POLL_INTERVAL_MS
} = process.env;

const pollInterval = Number(POLL_INTERVAL_MS || 15000);
const threshold = Number(SAFE_THRESHOLD || 2);
const safeServiceUrl = SERVICE_URL || 'https://safe-transaction-sepolia.safe.global';

async function init() {
    if (!SEPOLIA_RPC || !SAFE_ADDRESS || !BOT_PRIVATE_KEY || !AUTH_ADDRESS) {
        console.error("请检查 .env 文件，确保 SEPOLIA_RPC、SAFE_ADDRESS、BOT_PRIVATE_KEY、AUTH_ADDRESS 已设置");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
    const safeSdk = await Safe.init({
        provider: SEPOLIA_RPC,
        signer: BOT_PRIVATE_KEY,
        safeAddress: SAFE_ADDRESS
    });

    const signerList = (SIGNERS || '').split(',').map(a => a.trim().toLowerCase());
    if (!signerList.includes(wallet.address.toLowerCase())) signerList.push(wallet.address.toLowerCase());

    console.log("初始化完成：");
    console.log(" - Bot 地址:", wallet.address);
    console.log(" - Safe 地址:", SAFE_ADDRESS);
    console.log(" - 多签 signer:", signerList);
    console.log(" - 阈值:", threshold);
    console.log(" - 轮询间隔(ms):", pollInterval);

    return {wallet, safeSdk, provider, signerList};
}

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

// ACL 权限检查
async function checkACL(wallet) {
    try {

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
        const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
        console.log("🔍 检查机器人执行权限...");
        const selector = "0x00000000";
        const authorizer = new ethers.Contract(AUTH_ADDRESS, AUTH_ABI, wallet);
        const canExec = await authorizer.canExecute(wallet.address, SAFE_ADDRESS, selector);
        console.log("权限检查结果:", canExec);
        return canExec;

    } catch (err) {
        console.warn("ACL 检查失败，默认允许执行，错误:", err.message);
        return true;
    }
}

// 拉取 pending transactions
async function fetchPendingMultisigTxs() {
    try {
        const url = `${safeServiceUrl}/api/v1/safes/${SAFE_ADDRESS}/multisig-transactions/?executed=false&limit=50`;
        const res = await axios.get(url, {timeout: 15000});
        if (!res.data) return [];
        return res.data.results || res.data;
    } catch (err) {
        console.error("获取 pending txs 错误:", err.message);
        return [];
    }
}

// 检查 Bot 是否已签名
function botAlreadyConfirmed(tx, botAddress) {
    if (tx.confirmations && Array.isArray(tx.confirmations)) {
        return tx.confirmations.some(c => c.owner && c.owner.toLowerCase() === botAddress.toLowerCase());
    }
    return false;
}

// 签名并尝试执行
async function signAndExecute(safeSdk, wallet, txRaw, threshold) {
    try {
        const safeTransactionData = {
            to: txRaw.to,
            value: txRaw.value || "0",
            data: txRaw.data || "0x",
            operation: txRaw.operation || 0,
            safeTxGas: txRaw.safeTxGas || 0,
            baseGas: txRaw.baseGas || 0,
            gasPrice: txRaw.gasPrice || 0,
            gasToken: txRaw.gasToken || ethers.ZeroAddress,
            refundReceiver: txRaw.refundReceiver || ethers.ZeroAddress,
            nonce: txRaw.nonce
        };

        const safeTransaction = await safeSdk.createTransaction({safeTransactionData});

        // EIP-712 签名
        await safeSdk.signTransaction(safeTransaction);
        console.log("Bot 已签署 SafeTxHash:", await safeSdk.getTransactionHash(safeTransaction));

        const sigs = safeTransaction.signatures || {};
        const sigCount = Object.keys(sigs).length;
        console.log(`当前签名数量: ${sigCount}, 阈值: ${threshold}`);

        if (sigCount >= threshold) {
            console.log("签名已达到阈值，尝试执行交易...");
            const txResponse = await safeSdk.executeTransaction(safeTransaction);
            console.log("交易执行完成, txHash:", txResponse.hash);
        }
    } catch (err) {
        console.error("签名或执行失败:", err.message);
    }
}

// 主轮询
async function mainLoop(wallet, safeSdk, signerList) {
    const botAddress = wallet.address.toLowerCase();
    const allowed = await checkACL(wallet);
    if (!allowed) {
        console.error("Bot 未被 ACL 授权执行，停止脚本");
        process.exit(1);
    }

    console.log("进入轮询循环...");
    while (true) {
        try {
            const txs = await fetchPendingMultisigTxs();
            for (const txRaw of txs) {
                if (txRaw.isExecuted === true || txRaw.executed === true) continue;
                if (botAlreadyConfirmed(txRaw, botAddress)) continue;

                console.log("检测到未签名交易，SafeTxHash/nonce:", txRaw.safeTxHash || txRaw.nonce);
                await signAndExecute(safeSdk, wallet, txRaw, threshold);
            }
        } catch (err) {
            console.error("轮询错误:", err.message);
        }

        await new Promise(res => setTimeout(res, pollInterval));
    }
}

(async function () {
    try {
        const {wallet, safeSdk, signerList} = await init();
        await mainLoop(wallet, safeSdk, signerList);
    } catch (err) {
        console.error("Fatal error:", err.message);
    }
})();

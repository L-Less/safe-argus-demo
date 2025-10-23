import {ethers} from 'ethers';
import Safe from '@safe-global/protocol-kit';
import {expect} from 'chai';
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

const SEPOLIA_RPC = process.env.SEPOLIA_RPC;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const SIGNER1 = process.env.SIGNER1;
const SIGNER2 = process.env.SIGNER2;

describe('Safe 多签钱包测试', function () {
    // 设置超时时间为 60 秒（因为区块链交易可能需要时间）
    this.timeout(60000);

    let provider;
    let botWallet;
    let safeSdk;
    let signer1Wallet;
    let signer2Wallet;

    before(async function () {
        console.log('\n🔧 初始化测试环境...');

        // 创建 provider
        provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

        // 创建钱包
        botWallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
        signer1Wallet = new ethers.Wallet(SIGNER1, provider);
        signer2Wallet = new ethers.Wallet(SIGNER2, provider);

        console.log('Bot 地址:', botWallet.address);
        console.log('Signer1 地址:', signer1Wallet.address);
        console.log('Signer2 地址:', signer2Wallet.address);
        console.log('Safe 地址:', SAFE_ADDRESS);

        // 创建 Safe SDK 实例
        safeSdk = await Safe.init({
            provider: SEPOLIA_RPC,
            signer: SIGNER1,
            safeAddress: SAFE_ADDRESS
        });

        console.log('✅ 测试环境初始化完成\n');
    });

    describe('创建给自己转账的交易', function () {
        it('应该成功创建一个给 bot 自己转账的交易', async function () {
            console.log('\n📝 创建测试交易...');

            // 获取 bot 当前余额
            console.log('botWallet.address', botWallet.address)
            const balanceBefore = await provider.getBalance(botWallet.address);
            console.log('Bot 当前余额:', ethers.formatEther(balanceBefore), 'ETH');

            // 创建交易数据：给 bot 自己转账 0.001 ETH
            const transferAmount = '0.001';
            const safeTransactionData = [{
                to: '0x958815bCF93dC82C758f428BAef12313Eb5826a6',
                value: ethers.parseEther(transferAmount).toString(),
                data: '0x'
            }];

            console.log(`转账金额: ${transferAmount} ETH`);
            console.log('转账目标:', botWallet.address);

            // 创建 Safe 交易
            const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});

            // 验证交易数据
            expect(safeTransaction.data.to).to.equal('0x958815bCF93dC82C758f428BAef12313Eb5826a6');
            expect(safeTransaction.data.value).to.equal(ethers.parseEther(transferAmount).toString());
            expect(safeTransaction.data.data).to.equal('0x');

            // 获取交易哈希
            const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
            console.log('✅ 交易创建成功!');
            console.log('SafeTxHash:', safeTxHash);

            // 验证交易哈希格式
            expect(safeTxHash).to.be.a('string');
            expect(safeTxHash).to.match(/^0x[a-fA-F0-9]{64}$/);
        });

        it('应该能够用 Signer1 签名交易', async function () {
            console.log('\n✍️  Signer1 签名交易...');

            // 创建交易
            const safeTransactionData = [{
                to: botWallet.address,
                value: ethers.parseEther('0.001').toString(),
                data: '0x'
            }];

            const safeTransaction = await safeSdk.createTransaction({transactions: safeTransactionData});

            // Signer1 签名
            const signedTx = await safeSdk.signTransaction(safeTransaction);

            // 验证签名
            const signatures = signedTx.signatures;
            expect(signatures).to.not.be.empty;

            const signerAddress = signer1Wallet.address.toLowerCase();
            expect(signatures.has(signerAddress)).to.be.true;

            console.log('✅ Signer1 签名成功!');
            console.log('签名数量:', signatures.size);
        });

        it('应该能够用多个签名者签名交易', async function () {
            console.log('\n✍️  多签名者签名交易...');

            // 创建交易
            const safeTransactionData = [{
                to: botWallet.address,
                value: ethers.parseEther('0.001').toString(),
                data: '0x'
            }];

            // Signer1 创建并签名
            const safeSdk1 = await Safe.init({
                provider: SEPOLIA_RPC,
                signer: SIGNER1,
                safeAddress: SAFE_ADDRESS
            });
            const safeTransaction = await safeSdk1.createTransaction({transactions: safeTransactionData});
            const signedTx1 = await safeSdk1.signTransaction(safeTransaction);

            console.log('Signer1 已签名');
            console.log('Signer1 签名后数量:', signedTx1.signatures.size);

            // Signer2 签名同一个交易
            const safeSdk2 = await Safe.init({
                provider: SEPOLIA_RPC,
                signer: SIGNER2,
                safeAddress: SAFE_ADDRESS
            });
            const signedTx2 = await safeSdk2.signTransaction(signedTx1);

            console.log('Signer2 已签名');
            console.log('Signer2 签名后数量:', signedTx2.signatures.size);

            // 验证签名数量
            const signatures = signedTx2.signatures;
            expect(signatures.size).to.be.at.least(1);

            console.log('✅ 多签名完成!');
            console.log('总签名数量:', signatures.size);
        });
    });

    describe('查询 Safe 信息', function () {
        it('应该能够获取 Safe 的阈值', async function () {
            const threshold = await safeSdk.getThreshold();
            console.log('\n📊 Safe 阈值:', threshold);
            expect(threshold).to.be.a('number');
            expect(threshold).to.be.greaterThan(0);
        });

        it('应该能够获取 Safe 的所有者列表', async function () {
            const owners = await safeSdk.getOwners();
            console.log('\n👥 Safe 所有者:');
            owners.forEach((owner, index) => {
                console.log(`  ${index + 1}. ${owner}`);
            });
            expect(owners).to.be.an('array');
            expect(owners.length).to.be.greaterThan(0);
        });

        it('应该能够获取 Safe 的余额', async function () {
            const balance = await provider.getBalance(SAFE_ADDRESS);
            console.log('\n💰 Safe 余额:', ethers.formatEther(balance), 'ETH');
            expect(balance).to.be.a('bigint');
        });
    });
});

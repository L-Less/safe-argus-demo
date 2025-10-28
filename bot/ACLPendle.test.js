import {ethers} from "ethers";
import {expect} from "chai";

// ABI 数组
const aclAbi = [
    {"inputs": [], "stateMutability": "nonpayable", "type": "constructor"},

    {"inputs": [], "name": "AccessControlBadConfirmation", "type": "error"},
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
            "internalType": "bytes32",
            "name": "neededRole",
            "type": "bytes32"
        }], "name": "AccessControlUnauthorizedAccount", "type": "error"
    },

    {
        "inputs": [{"internalType": "address", "name": "bot", "type": "address"}],
        "name": "grantBot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "internalType": "address",
            "name": "account",
            "type": "address"
        }], "name": "grantRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "internalType": "address",
            "name": "callerConfirmation",
            "type": "address"
        }], "name": "renounceRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "bot", "type": "address"}],
        "name": "revokeBot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "internalType": "address",
            "name": "account",
            "type": "address"
        }], "name": "revokeRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },

    {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "indexed": true,
            "internalType": "bytes32",
            "name": "previousAdminRole",
            "type": "bytes32"
        }, {"indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32"}],
        "name": "RoleAdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
        }, {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}],
        "name": "RoleGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
        }, {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}],
        "name": "RoleRevoked",
        "type": "event"
    },

    {
        "inputs": [{"internalType": "address", "name": "market", "type": "address"}, {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
        }], "name": "setMarketApproval", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
        }], "name": "setTokenApproval", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },

    {
        "inputs": [],
        "name": "ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "allowedMarkets",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "allowedTokens",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "BOT_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
        "name": "getRoleAdmin",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
            "internalType": "address",
            "name": "account",
            "type": "address"
        }],
        "name": "hasRole",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "PENDLE_TOKEN",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
        "name": "supportsInterface",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs": [
            {"internalType": "address", "name": "receiver", "type": "address"},
            {"internalType": "address", "name": "market", "type": "address"},
            {"internalType": "uint256", "name": "minPtOut", "type": "uint256"},
            {
                "components": [{
                    "internalType": "uint256",
                    "name": "guessMin",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "guessMax", "type": "uint256"}, {
                    "internalType": "uint256",
                    "name": "guessOffchain",
                    "type": "uint256"
                }], "internalType": "struct ACLPendle.ApproxParams", "name": "guessPtOut", "type": "tuple"
            },
            {
                "components": [{
                    "internalType": "address",
                    "name": "tokenIn",
                    "type": "address"
                }, {"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {
                    "internalType": "bool",
                    "name": "isNative",
                    "type": "bool"
                }], "internalType": "struct ACLPendle.TokenInput", "name": "input", "type": "tuple"
            },
            {
                "components": [{
                    "internalType": "uint256",
                    "name": "maxSyFee",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "expiration", "type": "uint256"}, {
                    "internalType": "bytes32",
                    "name": "salt",
                    "type": "bytes32"
                }], "internalType": "struct ACLPendle.LimitOrderData", "name": "limit", "type": "tuple"
            }
        ],
        "name": "swapExactTokenForPt",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs": [
            {"internalType": "address", "name": "receiver", "type": "address"},
            {"internalType": "address", "name": "market", "type": "address"},
            {"internalType": "uint256", "name": "minYtOut", "type": "uint256"},
            {
                "components": [{
                    "internalType": "address",
                    "name": "tokenIn",
                    "type": "address"
                }, {"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {
                    "internalType": "bool",
                    "name": "isNative",
                    "type": "bool"
                }], "internalType": "struct ACLPendle.TokenInput", "name": "input", "type": "tuple"
            },
            {
                "components": [{
                    "internalType": "uint256",
                    "name": "maxSyFee",
                    "type": "uint256"
                }, {"internalType": "uint256", "name": "expiration", "type": "uint256"}, {
                    "internalType": "bytes32",
                    "name": "salt",
                    "type": "bytes32"
                }], "internalType": "struct ACLPendle.LimitOrderData", "name": "limit", "type": "tuple"
            }
        ],
        "name": "swapExactTokenForYt",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
];


import path from 'path';
import {fileURLToPath} from 'url';
import {loadEnvFile} from "./abot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.join(__dirname, '..', '.env');
const envVars = loadEnvFile(envPath);
Object.assign(process.env, envVars);

const {
    LOCAL_RPC,
    ACL_PENDLE_ADDRESS,
    BOT_PRIVATE_KEY,
    ADMIN_PRIVATE_KEY,
    OTHER_PRIVATE_KEY
} = process.env;


describe("ACLPendle Tests", function () {
    // 增加超时时间到30秒
    this.timeout(30000);

    let provider, adminSigner, botSigner, otherSigner, acl;

    // 配置项
    const RPC_URL = process.env.LOCAL_RPC;
    const ACL_ADDRESS = process.env.ACL_PENDLE_ADDRESS;
    const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
    const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
    const OTHER_PRIVATE_KEY = process.env.OTHER_PRIVATE_KEY;

    // 测试用的假地址
    const DUMMY_MARKET = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const DUMMY_TOKEN = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const DUMMY_RECEIVER = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";

    // 添加日志记录配置信息
    console.log("RPC_URL:", RPC_URL);
    console.log("ACL_ADDRESS:", ACL_ADDRESS);
    console.log("DUMMY_MARKET:", DUMMY_MARKET);
    console.log("DUMMY_TOKEN:", DUMMY_TOKEN);

    // 验证环境变量是否存在
    if (!ADMIN_PRIVATE_KEY) {
        throw new Error("ADMIN_PRIVATE_KEY environment variable is not set");
    }
    if (!BOT_PRIVATE_KEY) {
        throw new Error("BOT_PRIVATE_KEY environment variable is not set");
    }
    if (!OTHER_PRIVATE_KEY) {
        throw new Error("OTHER_PRIVATE_KEY environment variable is not set");
    }

    before(async function () {
        console.log("开始初始化测试环境...");

        try {
            // 创建provider并测试连接
            provider = new ethers.JsonRpcProvider(RPC_URL);

            // 创建 signer
            adminSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
            botSigner = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
            otherSigner = new ethers.Wallet(OTHER_PRIVATE_KEY, provider);

            // 检查账户余额
            const adminBalance = await provider.getBalance(adminSigner.address);
            console.log("Admin 余额:", ethers.formatEther(adminBalance), "ETH");

            if (adminBalance === 0n) {
                console.warn("警告: Admin 账户余额为0，交易可能会失败");
            }

            // 合约实例连接管理员 signer（用于权限操作）
            acl = new ethers.Contract(ACL_ADDRESS, aclAbi, adminSigner);

            // 验证合约地址是否正确
            try {
                const code = await provider.getCode(ACL_ADDRESS);
                if (code === "0x") {
                    throw new Error(`合约地址 ${ACL_ADDRESS} 没有代码，可能地址错误`);
                }
                console.log("合约验证成功");
            } catch (error) {
                console.error("合约验证失败:", error.message);
                throw error;
            }

            console.log("测试环境初始化完成");

        } catch (error) {
            console.error("初始化失败:", error.message);
            throw error;
        }
    });

    describe("Admin grants and revokes BOT role", function () {
        it("Admin can grant BOT role", async function () {
            console.log("测试: Admin 授权 BOT 角色");
            try {
                const tx = await acl.grantBot(botSigner.address);
                console.log("授权交易哈希:", tx.hash);
                await tx.wait();
                console.log("授权交易确认");

                const BOT_ROLE = await acl.BOT_ROLE();
                const hasRole = await acl.hasRole(BOT_ROLE, botSigner.address);
                expect(hasRole).to.be.true;
                console.log("BOT 角色验证成功");
            } catch (error) {
                console.error("授权 BOT 角色失败:", error.message);
                throw error;
            }
        });

        it("Admin can revoke BOT role", async function () {
            console.log("测试: Admin 撤销 BOT 角色");
            try {
                const tx = await acl.revokeBot(botSigner.address);
                console.log("撤销交易哈希:", tx.hash);
                await tx.wait();
                console.log("撤销交易确认");

                const BOT_ROLE = await acl.BOT_ROLE();
                const hasRole = await acl.hasRole(BOT_ROLE, botSigner.address);
                expect(hasRole).to.be.false;
                console.log("BOT 角色撤销验证成功");
            } catch (error) {
                console.error("撤销 BOT 角色失败:", error.message);
                throw error;
            }
        });

        it("Non-admin cannot grant BOT role", async function () {
            console.log("测试: 非管理员无法授权 BOT 角色");
            try {
                const aclOther = acl.connect(otherSigner);
                let errorThrown = false;
                try {
                    await aclOther.grantBot(botSigner.address);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非管理员授权失败验证成功");
            } catch (error) {
                console.error("非管理员授权测试失败:", error.message);
                throw error;
            }
        });

        it("Non-admin cannot revoke BOT role", async function () {
            console.log("测试: 非管理员无法撤销 BOT 角色");
            try {
                const aclOther = acl.connect(otherSigner);

                let errorThrown = false;
                try {
                    await aclOther.revokeBot(botSigner.address);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非管理员撤销失败验证成功");
            } catch (error) {
                console.error("非管理员撤销测试失败:", error.message);
                throw error;
            }
        });
    });

    describe("Admin market and token approval", function () {
        it("Admin can set market approval", async function () {

            console.log("测试: Admin 设置市场授权");
            try {
                // 获取当前 nonce
                const nonce = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce);

                const tx = await acl.setMarketApproval(DUMMY_MARKET, true, {nonce});
                console.log("市场授权交易哈希:", tx.hash);
                await tx.wait();
                console.log("市场授权交易确认");

                const isApproved = await acl.allowedMarkets(DUMMY_MARKET);
                expect(isApproved).to.be.true;
                console.log("市场授权验证成功");
            } catch (error) {
                console.error("设置市场授权失败:", error.message);
                throw error;
            }
        });

        it("Admin can set token approval", async function () {

            console.log("测试: Admin 设置代币授权");
            try {
                // 获取当前 nonce
                const nonce = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce);

                const tx = await acl.setTokenApproval(DUMMY_TOKEN, true, {nonce});
                console.log("代币授权交易哈希:", tx.hash);
                await tx.wait();
                console.log("代币授权交易确认");

                const isApproved = await acl.allowedTokens(DUMMY_TOKEN);
                expect(isApproved).to.be.true;
                console.log("代币授权验证成功");
            } catch (error) {
                console.error("设置代币授权失败:", error.message);
                throw error;
            }
        });

        it("Non-admin cannot set market approval", async function () {

            console.log("测试: 非管理员无法设置市场授权");
            try {
                const aclOther = acl.connect(otherSigner);
                let errorThrown = false;
                try {
                    await aclOther.setMarketApproval(DUMMY_MARKET, true);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非管理员设置市场授权失败验证成功");
            } catch (error) {
                console.error("非管理员设置市场授权测试失败:", error.message);
                throw error;
            }
        });

        it("Non-admin cannot set token approval", async function () {

            console.log("测试: 非管理员无法设置代币授权");
            try {
                const aclOther = acl.connect(otherSigner);
                let errorThrown = false;
                try {
                    await aclOther.setTokenApproval(DUMMY_TOKEN, true);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非管理员设置代币授权失败验证成功");
            } catch (error) {
                console.error("非管理员设置代币授权测试失败:", error.message);
                throw error;
            }
        });
    });

    describe("BOT function calls", function () {
        before(async function () {
            console.log("BOT function calls - 开始设置权限...");
            try {
                // 确保 BOT 拥有权限
                console.log("授权 BOT 角色...");
                const tx1 = await acl.grantBot(botSigner.address);
                await tx1.wait();
                console.log("BOT 角色授权完成");

                // 设置市场授权
                // 获取当前 nonce
                const nonce = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce);

                const tx = await acl.setMarketApproval(DUMMY_MARKET, true, {nonce});
                console.log("市场授权交易哈希:", tx.hash);
                await tx.wait();
                console.log("市场授权交易确认");

                const isApproved = await acl.allowedMarkets(DUMMY_MARKET);
                expect(isApproved).to.be.true;
                console.log("市场授权验证成功");

                // 设置代币授权
                // 获取当前 nonce
                const nonce1 = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce1);

                const tx2 = await acl.setTokenApproval(DUMMY_TOKEN, true, {nonce1});
                console.log("代币授权交易哈希:", tx2.hash);
                await tx2.wait();
                console.log("代币授权交易确认");

                const isApproved1 = await acl.allowedTokens(DUMMY_TOKEN);
                expect(isApproved1).to.be.true;
                console.log("代币授权验证成功");

                const botSignerBalance = await provider.getBalance(botSigner.address);
                console.log("BOT 账户余额:", ethers.formatEther(botSignerBalance), "ETH");
                console.log("BOT function calls - 权限设置完成");
            } catch (error) {
                console.error("BOT function calls before 钩子失败:", error.message);
                throw error;
            }
        });

        it("BOT can call swapExactTokenForYt with valid parameters", async function () {

            console.log("测试: BOT 调用 swapExactTokenForYt");
            try {
                const aclBot = acl.connect(botSigner);

                // 准备参数
                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                console.log('limitOrderData', limitOrderData)

                const result = await aclBot.swapExactTokenForYt(
                    DUMMY_RECEIVER,
                    DUMMY_MARKET,
                    ethers.parseEther("0.9"),
                    tokenInput,
                    limitOrderData
                );

                expect(result).to.equal(true);
                console.log("swapExactTokenForYt 函数调用成功，返回:", result);
            } catch (error) {
                console.error("swapExactTokenForYt 调用失败:", error.message);
                throw error;
            }
        });

        it("BOT can call swapExactTokenForPt with valid parameters", async function () {

            console.log("测试: BOT 调用 swapExactTokenForPt");
            try {
                const aclBot = acl.connect(botSigner);

                // 准备参数
                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                const approxParams = {
                    guessMin: ethers.parseEther("0.8"),
                    guessMax: ethers.parseEther("1.2"),
                    guessOffchain: ethers.parseEther("1.0")
                };

                const result = await aclBot.swapExactTokenForPt(
                    DUMMY_RECEIVER,
                    DUMMY_MARKET,
                    ethers.parseEther("0.9"),
                    approxParams,
                    tokenInput,
                    limitOrderData
                );

                expect(result).to.equal(true);
                console.log("swapExactTokenForPt 函数调用成功，返回:", result);
            } catch (error) {
                console.error("swapExactTokenForPt 调用失败:", error.message);
                throw error;
            }
        });
    });

    describe("Parameter validation tests", function () {
        before(async function () {
            console.log("BOT function calls - 开始设置权限...");
            try {
                // 确保 BOT 拥有权限
                console.log("授权 BOT 角色...");
                const tx1 = await acl.grantBot(botSigner.address);
                await tx1.wait();
                console.log("BOT 角色授权完成");

                // 设置市场授权
                // 获取当前 nonce
                const nonce = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce);

                const tx = await acl.setMarketApproval(DUMMY_MARKET, true, {nonce});
                console.log("市场授权交易哈希:", tx.hash);
                await tx.wait();
                console.log("市场授权交易确认");

                const isApproved = await acl.allowedMarkets(DUMMY_MARKET);
                expect(isApproved).to.be.true;
                console.log("市场授权验证成功");

                // 设置代币授权
                // 获取当前 nonce
                const nonce1 = await provider.getTransactionCount(adminSigner.address);
                console.log("当前 nonce:", nonce1);

                const tx2 = await acl.setTokenApproval(DUMMY_TOKEN, true, {nonce1});
                console.log("代币授权交易哈希:", tx2.hash);
                await tx2.wait();
                console.log("代币授权交易确认");

                const isApproved1 = await acl.allowedTokens(DUMMY_TOKEN);
                expect(isApproved1).to.be.true;
                console.log("代币授权验证成功");

                const botSignerBalance = await provider.getBalance(botSigner.address);
                console.log("BOT 账户余额:", ethers.formatEther(botSignerBalance), "ETH");
                console.log("BOT function calls - 权限设置完成");
            } catch (error) {
                console.error("BOT function calls before 钩子失败:", error.message);
                throw error;
            }
        });

        it("swapExactTokenForYt fails with invalid receiver", async function () {

            console.log("测试: swapExactTokenForYt 无效接收者");
            try {
                const aclBot = acl.connect(botSigner);

                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600,
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                let errorThrown = false;
                try {
                    await aclBot.swapExactTokenForYt(
                        ethers.ZeroAddress, // 无效接收者
                        DUMMY_MARKET,
                        ethers.parseEther("0.9"),
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("invalid receiver");
                }

                expect(errorThrown).to.be.true;
                console.log("无效接收者验证成功");
            } catch (error) {
                console.error("无效接收者测试失败:", error.message);
                throw error;
            }
        });

        it("swapExactTokenForYt fails with unapproved market", async function () {

            console.log("测试: swapExactTokenForYt 未授权的市场");
            try {
                const aclBot = acl.connect(botSigner);

                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600,
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                let errorThrown = false;
                try {
                    await aclBot.swapExactTokenForYt(
                        DUMMY_RECEIVER,
                        "0x0000000000000000000000000000000000000004", // 未授权的市场
                        ethers.parseEther("0.9"),
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("market not approved");
                }

                expect(errorThrown).to.be.true;
                console.log("未授权市场验证成功");
            } catch (error) {
                console.error("未授权市场测试失败:", error.message);
                throw error;
            }
        });

        it("swapExactTokenForYt fails with unapproved token", async function () {

            console.log("测试: swapExactTokenForYt 未授权的代币");
            try {
                const aclBot = acl.connect(botSigner);

                const tokenInput = {
                    tokenIn: "0x0000000000000000000000000000000000000005", // 未授权的代币
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600,
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                let errorThrown = false;
                try {
                    await aclBot.swapExactTokenForYt(
                        DUMMY_RECEIVER,
                        DUMMY_MARKET,
                        ethers.parseEther("0.9"),
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("token not approved");
                }

                expect(errorThrown).to.be.true;
                console.log("未授权代币验证成功");
            } catch (error) {
                console.error("未授权代币测试失败:", error.message);
                throw error;
            }
        });

        it("swapExactTokenForYt fails with expired order", async function () {

            console.log("测试: swapExactTokenForYt 过期的订单");
            try {
                const aclBot = acl.connect(botSigner);

                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) - 3600, // 1小时前过期
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                let errorThrown = false;
                try {
                    await aclBot.swapExactTokenForYt(
                        DUMMY_RECEIVER,
                        DUMMY_MARKET,
                        ethers.parseEther("0.9"),
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("order expired");
                }

                expect(errorThrown).to.be.true;
                console.log("过期订单验证成功");
            } catch (error) {
                console.error("过期订单测试失败:", error.message);
                throw error;
            }
        });
    });

    describe("Non-BOT cannot call functions", function () {
        it("Other signer cannot call swapExactTokenForYt", async function () {

            console.log("测试: 非BOT无法调用swapExactTokenForYt");
            try {
                const aclOther = acl.connect(otherSigner);

                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600,
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                let errorThrown = false;
                try {
                    await aclOther.swapExactTokenForYt(
                        DUMMY_RECEIVER,
                        DUMMY_MARKET,
                        ethers.parseEther("0.9"),
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/unauthorized|AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非BOT调用swapExactTokenForYt失败验证成功");
            } catch (error) {
                console.error("非BOT调用swapExactTokenForYt测试失败:", error.message);
                throw error;
            }
        });

        it("Other signer cannot call swapExactTokenForPt", async function () {

            console.log("测试: 非BOT无法调用swapExactTokenForPt");
            try {
                const aclOther = acl.connect(otherSigner);

                const tokenInput = {
                    tokenIn: DUMMY_TOKEN,
                    amountIn: ethers.parseEther("1"),
                    isNative: false
                };

                const limitOrderData = {
                    maxSyFee: ethers.parseEther("0.01"),
                    expiration: Math.floor(Date.now() / 1000) + 3600,
                    salt: ethers.keccak256(ethers.toUtf8Bytes("test"))
                };

                const approxParams = {
                    guessMin: ethers.parseEther("0.8"),
                    guessMax: ethers.parseEther("1.2"),
                    guessOffchain: ethers.parseEther("1.0")
                };

                let errorThrown = false;
                try {
                    await aclOther.swapExactTokenForPt(
                        DUMMY_RECEIVER,
                        DUMMY_MARKET,
                        ethers.parseEther("0.9"),
                        approxParams,
                        tokenInput,
                        limitOrderData
                    );
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    // 检查是否是权限相关的错误（自定义错误或标准错误）
                    expect(error.message).to.match(/unauthorized|AccessControl.*account.*missing role|execution reverted.*unknown custom error|AccessControlUnauthorizedAccount/);
                }

                expect(errorThrown).to.be.true;
                console.log("非BOT调用swapExactTokenForPt失败验证成功");
            } catch (error) {
                console.error("非BOT调用swapExactTokenForPt测试失败:", error.message);
                throw error;
            }
        });
    });
});

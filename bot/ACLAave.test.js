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
        "inputs": [],
        "name": "AAVE_TOKEN",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "asset", "type": "address"}, {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "interestRateMode", "type": "uint256"}, {
            "internalType": "address",
            "name": "onBehalfOf",
            "type": "address"
        }],
        "name": "borrow",
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
        "inputs": [{"internalType": "address", "name": "asset", "type": "address"}, {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"internalType": "address", "name": "onBehalfOf", "type": "address"}],
        "name": "deposit",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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
        "inputs": [{"internalType": "address", "name": "asset", "type": "address"}, {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "interestRateMode", "type": "uint256"}, {
            "internalType": "address",
            "name": "onBehalfOf",
            "type": "address"
        }],
        "name": "repay",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "asset", "type": "address"}, {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"internalType": "address", "name": "onBehalfOf", "type": "address"}],
        "name": "supply",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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
        "inputs": [{"internalType": "address", "name": "asset", "type": "address"}, {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        }, {"internalType": "address", "name": "to", "type": "address"}],
        "name": "withdraw",
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
    ACL_AAVE_ADDRESS,
    BOT_PRIVATE_KEY,
    ADMIN_PRIVATE_KEY,
    OTHER_PRIVATE_KEY
} = process.env;


describe("ACLAave Tests", function () {
    // 增加超时时间到30秒
    this.timeout(30000);

    let provider, adminSigner, botSigner, otherSigner, acl;

    // 配置项
    const RPC_URL = process.env.LOCAL_RPC;     // 替换成你的RPC
    const ACL_ADDRESS = process.env.ACL_AAVE_ADDRESS;      // 已部署合约地址
    const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;   // BOT 私钥
    const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;  // 管理员私钥
    const OTHER_PRIVATE_KEY = process.env.OTHER_PRIVATE_KEY;// 非 BOT / 非 admin
    const DUMMY_ASSET = "0x0000000000000000000000000000000000000001"; // 测试资产

    // 添加日志记录配置信息（不包括私钥）
    console.log("RPC_URL:", RPC_URL);
    console.log("ACL_ADDRESS:", ACL_ADDRESS);
    console.log("DUMMY_ASSET:", DUMMY_ASSET);

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

    describe("BOT function calls", function () {
        before(async function () {
            // 确保 BOT 拥有权限
            await acl.grantBot(botSigner.address);
            const botSignerBalance = await provider.getBalance(botSigner.address);
            console.log("BOT 账户余额:", ethers.formatEther(botSignerBalance), "ETH")
        });

        it("BOT can call supply", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.supply(DUMMY_ASSET, 1000, botSigner.address);
            expect(result).to.equal(true);
            console.log("Supply 函数调用成功，返回:", result);
        });

        it("BOT can call withdraw", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.withdraw(DUMMY_ASSET, 500, botSigner.address);
            expect(result).to.equal(true);
            console.log("Withdraw 函数调用成功，返回:", result);
        });

        it("BOT can call borrow", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.borrow(DUMMY_ASSET, 200, 1, botSigner.address);
            expect(result).to.equal(true);
            console.log("Borrow 函数调用成功，返回:", result);
        });

        it("BOT can call repay", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.repay(DUMMY_ASSET, 200, 1, botSigner.address);
            expect(result).to.equal(true);
            console.log("Repay 函数调用成功，返回:", result);
        });

        it("BOT can call deposit", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.deposit(DUMMY_ASSET, 1000, botSigner.address);
            expect(result).to.equal(true);
            console.log("Deposit 函数调用成功，返回:", result);
        });
    });

    describe("Non-BOT cannot call functions", function () {
        it("Other signer cannot call supply", async function () {
            this.timeout(10000); // 10秒超时
            console.log("测试: 非BOT无法调用supply");
            try {
                const aclOther = acl.connect(otherSigner);

                let errorThrown = false;
                try {
                    await aclOther.supply(DUMMY_ASSET, 1000, otherSigner.address);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("unauthorized");
                }

                expect(errorThrown).to.be.true;
                console.log("非BOT调用supply失败验证成功");
            } catch (error) {
                console.error("非BOT调用supply测试失败:", error.message);
                throw error;
            }
        });

        it("Other signer cannot call withdraw", async function () {
            this.timeout(10000); // 10秒超时
            console.log("测试: 非BOT无法调用withdraw");
            try {
                const aclOther = acl.connect(otherSigner);

                let errorThrown = false;
                try {
                    await aclOther.withdraw(DUMMY_ASSET, 500, otherSigner.address);
                } catch (error) {
                    errorThrown = true;
                    console.log("捕获到预期错误:", error.message);
                    expect(error.message).to.include("unauthorized");
                }

                expect(errorThrown).to.be.true;
                console.log("非BOT调用withdraw失败验证成功");
            } catch (error) {
                console.error("非BOT调用withdraw测试失败:", error.message);
                throw error;
            }
        });
    });
});

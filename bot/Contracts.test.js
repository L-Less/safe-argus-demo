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


describe("ACLAave Tests", function () {
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

    before(async function () {
        provider = new ethers.JsonRpcProvider(RPC_URL);

        // 创建 signer
        adminSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        botSigner = new ethers.Wallet(BOT_PRIVATE_KEY, provider);
        otherSigner = new ethers.Wallet(OTHER_PRIVATE_KEY, provider);

        // 合约实例连接管理员 signer（用于权限操作）
        acl = new ethers.Contract(ACL_ADDRESS, aclAbi, adminSigner);
    });

    describe("Admin grants and revokes BOT role", function () {
        it("Admin can grant BOT role", async function () {
            console.log(adminSigner.getBalance());
            await acl.grantBot(botSigner.address);
            const BOT_ROLE = await acl.BOT_ROLE();
            const hasRole = await acl.hasRole(BOT_ROLE, botSigner.address);
            expect(hasRole).to.be.true;
        });

        it("Admin can revoke BOT role", async function () {
            await acl.revokeBot(botSigner.address);
            const BOT_ROLE = await acl.BOT_ROLE();
            const hasRole = await acl.hasRole(BOT_ROLE, botSigner.address);
            expect(hasRole).to.be.false;
        });

        it("Non-admin cannot grant BOT role", async function () {
            const aclOther = acl.connect(otherSigner);
            await expect(
                aclOther.grantBot(botSigner.address)
            ).to.be.revertedWith(`AccessControl: account ${otherSigner.address.toLowerCase()} is missing role ${await acl.DEFAULT_ADMIN_ROLE()}`);
        });

        it("Non-admin cannot revoke BOT role", async function () {
            // 先由 admin 授权 BOT
            await acl.grantBot(botSigner.address);
            const aclOther = acl.connect(otherSigner);
            await expect(
                aclOther.revokeBot(botSigner.address)
            ).to.be.revertedWith(`AccessControl: account ${otherSigner.address.toLowerCase()} is missing role ${await acl.DEFAULT_ADMIN_ROLE()}`);
        });
    });

    describe("BOT function calls", function () {
        before(async function () {
            // 确保 BOT 拥有权限
            await acl.grantBot(botSigner.address);
        });

        it("BOT can call supply", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.supply(DUMMY_ASSET, 1000, botSigner.address);
            expect(result).to.equal(true);
        });

        it("BOT can call withdraw", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.withdraw(DUMMY_ASSET, 500, botSigner.address);
            expect(result).to.equal(true);
        });

        it("BOT can call borrow", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.borrow(DUMMY_ASSET, 200, 1, botSigner.address);
            expect(result).to.equal(true);
        });

        it("BOT can call repay", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.repay(DUMMY_ASSET, 200, 1, botSigner.address);
            expect(result).to.equal(true);
        });

        it("BOT can call deposit", async function () {
            const aclBot = acl.connect(botSigner);
            const result = await aclBot.deposit(DUMMY_ASSET, 1000, botSigner.address);
            expect(result).to.equal(true);
        });
    });

    describe("Non-BOT cannot call functions", function () {
        it("Other signer cannot call supply", async function () {
            const aclOther = acl.connect(otherSigner);
            await expect(
                aclOther.supply(DUMMY_ASSET, 1000, otherSigner.address)
            ).to.be.revertedWith("ACLPendleBot: unauthorized");
        });

        it("Other signer cannot call withdraw", async function () {
            const aclOther = acl.connect(otherSigner);
            await expect(
                aclOther.withdraw(DUMMY_ASSET, 500, otherSigner.address)
            ).to.be.revertedWith("ACLPendleBot: unauthorized");
        });
    });
});

# Safe + Argus + ACL Demo (Sepolia)

## 安装依赖
```
npm install
```

## 编译合约
```
npm run compile
```

## 部署 Authorizer 到 Sepolia
```
npm run deploy
```

## 运行 Bot
```
npm run bot
```

## 配置
复制 `.env.example` 为 `.env` 并填写正确的 RPC、私钥、Safe 地址和 Authorizer 地址

生成交易 -> Bot EIP-712 签名 -> 提交到 Transaction Service -> 其他 signer 手动补签 -> 达到阈值 -> Bot 自动执行交易

flowchart TD
A[生成交易: 创建 SafeTx] --> B[Bot 自动轮询 Transaction Service]
B --> C[Bot 对 SafeTxHash 进行 EIP-712 签名]
C --> D[提交 Bot 签名到 Transaction Service]

    subgraph 手动补签流程
        E1[其他 signer 查看 Pending Transaction]
        E2[使用 Safe Web / 钱包确认签名]
        E3[签名上传到 Transaction Service]
        E1 --> E2 --> E3
    end
    
    D --> F{签名数量达到阈值?}
    E3 --> F
    F -->|否| B
    F -->|是| G[Bot 或任意 signer 执行交易]
    G --> H[交易完成，Safe 链上状态更新]

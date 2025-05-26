# Web3 Garden App

基于 Next.js 15 构建的 Web3 大学应用程序，集成了以太坊钱包连接功能和现代前端开发实践。

## 功能特点

- 基于 Next.js 15 和 React 19
- 集成 RainbowKit 和 wagmi 实现以太坊钱包连接
- 使用 Tailwind CSS 4 构建响应式界面
- 支持 TypeScript
- 使用 Cloudflare Workers 部署

## 环境要求

- Node.js >= 20.0.0
- Yarn 1.22.19 (推荐的包管理器)

## 快速开始

### 安装

```bash
# 安装依赖
yarn install
```

### 本地开发环境配置

在开始开发之前，你需要设置必要的环境变量：

1. 创建 `.env.local` 文件在项目根目录 (已在 .gitignore 中被忽略)
2. 添加以下环境变量：

```bash
# WalletConnect ProjectID (必须配置)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的WalletConnect项目ID
```

注意：一个 ProjectID 可以用于开发环境中的多个项目，但在生产环境中最好为每个项目使用单独的 ProjectID。

#### 获取 WalletConnect ProjectID

1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. 创建账户并登录
3. 创建一个新项目
4. 复制生成的 ProjectID 添加到 `.env.local` 文件

### 开发

```bash
# 启动开发服务器
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用程序。

### 构建与部署

```bash
# 构建应用
yarn build

# 启动生产环境服务器
yarn start

# 部署到 Cloudflare Workers
yarn deploy
```

## Cloudflare Workers 开发

```bash
# 构建 Worker 并启动本地预览
yarn preview

# 开发 Worker
yarn dev:worker
```

## 代码规范

项目使用 ESLint、Prettier、Stylelint 和 Husky 进行代码规范管理。

```bash
# 运行 ESLint
yarn lint

# 格式化代码
yarn format
```

## 常见问题解决

### WagmiProviderNotFoundError

如果遇到此错误，请检查：

1. 确保配置了有效的 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
2. 重启开发服务器以应用环境变量更改

### deploy:cf部署不成功

```bash
# 修改执行命令
"deploy:cf": "ESLINT_NO_DEV_ERRORS=true CI=false yarn run pages:build && wrangler pages deploy"
```

## 项目结构

```
web3-garden-app/
├── public/                # 静态资源
├── src/
│   ├── app/               # 应用路由和页面
│   ├── components/        # React 组件
│   │   ├── common/        # 通用组件
│   │   └── wallet/        # 钱包相关组件
│   ├── config/            # 应用配置
│   ├── hooks/             # 自定义 React Hooks
│   └── lib/               # 工具函数和库
```


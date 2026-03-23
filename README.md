# 饮食记录（Docker 独立版）

这是可直接上传 GitHub 的独立目录，包含运行所需全部源码和 Docker 配置。
支持飞牛 NAS 通过 Docker Compose 一键部署，默认端口 `7778`。

## 功能

- **基础食材**：按分类浏览生鲜/原料，自选克数加入记录（热量按 kcal/100g 估算）
- **身体数据**：性别、年龄、身高、体重、活动量 → **基础代谢 BMR**（Mifflin-St Jeor）与 **TDEE**；可选手动每日目标；按当前查看日期显示 **已摄入 / 还可摄入** 热量
- **语音识别**：浏览器原生语音转文字（API 不参与语音识别）
- **饮食解析**：自动匹配食物及克数、热量，支持 LLM 智能解析
  - 对食材单外的新食材：调用大模型解析后会自动加入本地食材单并自动归类
- **按日期归类**：记录按日期分组，支持切换查看
- **API 设置**：可配置大模型 API
- **Android 应用**：可打包为 APK 在手机上使用

## 本地开发（可选）

```bash
cd diet-tracker-docker
npm install
npm run dev
```

浏览器访问 http://localhost:5174

## Docker 打包与运行（含持久化数据存储）

```bash
cd diet-tracker-docker
docker build -t diet-tracker:latest .
docker run -d \
  --name diet-tracker \
  -p 7778:80 \
  -v /vol1/docker/diet-tracker-data:/data \
  --restart unless-stopped \
  diet-tracker:latest
```

浏览器访问 [http://localhost:7778](http://localhost:7778)

说明：
- 容器会把数据写入 `/data/state.json`
- 通过挂载 `-v 主机目录:/data` 实现 NAS 重启/容器重建后数据不丢
- 若不挂载卷，删除容器后数据会丢失

### Docker Compose（一键启动，推荐飞牛 NAS）

项目已内置 `docker-compose.yml`，在项目目录执行：

```bash
docker compose up -d --build
```

停止并删除容器：

```bash
docker compose down
```

默认映射：
- 访问端口：`7778`
- 持久化目录：`./docker-data`（容器内为 `/data`）

## 上传 GitHub 建议

```bash
git init
git add .
git commit -m "init standalone docker edition"
```

随后创建远程仓库并推送即可。`node_modules`、`dist`、`docker-data` 已在 `.gitignore` 中排除。

## API 设置

在「大模型 API」中配置，支持 **国内主流大模型**：

| 服务商 | 说明 |
|--------|------|
| OpenAI / One-API | 国际通用，支持 Whisper |
| 通义千问 | 阿里云 |
| 智谱 ChatGLM | 智谱清言 |
| Kimi | 月之暗面 |
| 豆包 | 字节跳动 |
| 文心一言 | 百度（建议通过 One-API 等代理） |
| 讯飞星火 | 科大讯飞 |
| DeepSeek | |
| 腾讯混元 | |
| MiniMax | |
| 零一万物 Yi | |
| 百川智能 | |

- **服务商**：选择预设，自动填充基础地址与模型
- **API Key**：各平台 Key
- **语音识别**：固定使用浏览器原生（电脑端）；手机端使用输入法语音输入

## 打包 Android APK

**前置**：需安装 [Android Studio](https://developer.android.com/studio) 和 JDK 17。

```bash
# 1. 构建并同步
npm run cap:sync

# 2. 用 Android Studio 打开项目
npx cap open android

# 3. 在 Android Studio：Build > Build Bundle(s) / APK(s) > Build APK(s)
```

或命令行直接构建 Debug APK：

```bash
npm run android:apk
```

APK 输出路径：`android/app/build/outputs/apk/debug/app-debug.apk`

首次构建会下载 Gradle 依赖，可能需要数分钟。

### 麦克风权限说明

- 首次打开应用时会请求麦克风权限，请选择「允许」
- 若提示「无法访问麦克风」：请到 **设置 → 应用 → 饮食记录 → 权限** 中手动开启麦克风
- 部分机型（如小米、OPPO）可能还需在应用权限或自启动管理中允许权限

## 技术栈

- React + TypeScript + Vite
- Web Speech API（语音识别）
- Capacitor（Android 打包）
- Docker + Node.js（容器部署）
- localStorage + 服务端文件存储（`/data/state.json`）

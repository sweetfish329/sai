# Sai

囲碁 AI コーチングアプリケーション。Hono.js と Mastra を活用し、あなたの棋譜から上達のためのヒントを提供します。

## プロジェクトの目的

囲碁の楽しみを広げ、プレイヤーの棋力向上をサポートする AI パートナーを作成すること。

## フェーズ 1: SGF 感想戦機能

Katrain などの既存 AI と対局した SGF ファイルをアップロードすることで、より人間らしく、教育的なフィードバックを生成します。

### 主な機能

- SGF ファイルの読み込み
- AI による対局の振り返りコメント生成
- 改善点の提案

## 技術スタック

- [React](https://react.dev/)
- [Material-UI](https://mui.com/)

## セットアップ

1. **依存関係のインストール**:

   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Google OAuth の設定**:

   - Google Cloud Console でプロジェクトを作成し、OAuth 同意画面を設定します。
   - 「OAuth クライアント ID」を作成します（アプリケーションの種類: ウェブ アプリケーション）。
   - **承認済みの JavaScript 生成元**に `http://localhost:3000` と `http://localhost:5173` を追加します。

3. **環境変数の設定**:

   プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定してください:

   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   `frontend/.env` ファイルは不要になりました（バックエンドから取得するため）。

## 実行方法



```bash
npm run build
npm run dev
```

ポート 3000 で起動します。ブラウザで `http://localhost:3000` にアクセスしてください。
フロントエンドはビルドされ、バックエンドから静的ファイルとして配信されます。

### 開発モード (フロントエンド単体)

フロントエンドのみを開発する場合は以下を実行します:

```bash
cd frontend
npm run dev
```

ポート 5173 で起動します。ブラウザで `http://localhost:5173` にアクセスしてください。

### MCP サーバー

このプロジェクトは Model Context Protocol (MCP) サーバーとしても機能します。
Claude Desktop などの MCP クライアントから直接ツールを利用できます。

#### 設定方法 (Claude Desktop)

`claude_desktop_config.json` に以下を追加してください:

```json
{
  "mcpServers": {
    "sai": {
      "command": "npx",
      "args": ["-y", "sai-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

※ ローカル開発版を使用する場合は、`command` を `node`、`args` を `["/absolute/path/to/project/dist/mcp-server.js"]` に変更してください。

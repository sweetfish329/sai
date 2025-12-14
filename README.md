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

- **Backend**: Golang (Echo v4), Genkit
- **Frontend**: React (Vite), Material-UI
- **Tools**: Bun (Runtime/PackageManager), Biome (Linter/Formatter)

## セットアップ

### 前提条件

- Go 1.22+
- Bun 1.1+

1. **依存関係のインストール**:

   ```bash
   bun install
   cd frontend && bun install && cd ..
   ```

2. **Google OAuth の設定**:

   - Google Cloud Console でプロジェクトを作成し、OAuth 同意画面を設定します。
   - 「OAuth クライアント ID」を作成します（アプリケーションの種類: ウェブ アプリケーション）。
   - **承認済みの JavaScript 生成元**に `http://localhost:3000` を追加します。

3. **環境変数の設定**:

   プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定してください:

   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## 実行方法

### 開発・実行

```bash
bun run dev
# または
go run cmd/server/main.go
# フロントエンドのビルドも含む場合:
bun run build
```

ポート 3000 で起動します。ブラウザで `http://localhost:3000` にアクセスしてください。
フロントエンドはビルドされ、バックエンドから静的ファイルとして配信されます。

### 開発モード (フロントエンド単体)

フロントエンドのみを開発する場合は以下を実行します:

```bash
cd frontend
bun run dev
```

ポート 5173 で起動します。ブラウザで `http://localhost:5173` にアクセスしてください。
(バックエンドAPIを利用する場合はプロキシ設定またはCORS設定に注意してください)

### MCP サーバー

(Go移行に伴い、現在MCPサーバー機能は一時的に削除されています)

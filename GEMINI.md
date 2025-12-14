# Sai - Go AI Coaching Application

## プロジェクト概要

Hono.js と Mastra を使用した、囲碁の AI コーチングアプリケーション。
ユーザーの棋譜(SGF)を分析し、AI による感想や指導を提供する。

## 技術スタック

- **Backend/Framework**: Golang (Echo v4)
- **Frontend**: React, Material-UI (Vite)
- **AI Orchestration**: Genkit for Go
- **Package Manager / Runtime**: Bun (npm prohibited via `only-allow`)
- **Linter / Formatter**: Biome
- **Input Format**: SGF (Smart Game Format)
TypeScriptではNo-Semiスタイルを採用する。

## フェーズ 1: SGF 分析と指導

### 目標

Katrain などで生成された SGF ファイルを読み込み、その内容に基づいて AI が感想戦や指導を行う機能の実装。

### 機能要件

1. **SGF アップロード/入力**: ユーザーが SGF ファイルを提供できるインターフェース。
2. **SGF 解析**: Go言語によるカスタムパーサー (`internal/sgf`) で棋譜を解析。
3. **AI 分析・生成**: Genkit for Go を使用して、Google Gemini モデルにより指導・感想コメントを生成。
    - 形勢判断
    - 悪手の指摘と改善案
    - 全体的な総評
    - 盤面画像の生成 (`internal/image` + `fogleman/gg`)
4. **フィードバック表示**: 生成された指導内容をユーザーに提示。

### 遵守事項

MastraからGenkitへ移行済み。Go言語の標準的なディレクトリ構成 (`cmd`, `internal`) に従う。

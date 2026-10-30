# 設計: 依存関係のセキュリティ更新

## 2026-10-22の対応（履歴）

## 方針

- `package.json` の `next` を 16.2.10 から `16.4.2` にする。ソースは変更しない。
- Next.js 自身の依存が上がる分に加え、更新後の再照合で残った、範囲内で直せる部品は `npm update` で上げる。

## 検討して見送った案

- `eslint-config-next` も上げる: 同梱のルールが変わり、lint の指摘が増えるおそれがある。今回の目的に不要なため見送り。

## 影響

- 変更ファイル: `package.json`（1 行）・`package-lock.json`。
- 上がった版:

| パッケージ | 更新前 | 更新後 |
|---|---|---|
| next | 16.2.10 | 16.4.2 |
| sharp | 0.34.5 | 0.35.5 |
| source-map-js | 1.2.1 | 1.2.2 |
| baseline-browser-mapping | 2.10.42 | 2.11.30 |

## 2026-10-30の追加設計

Vitest/Vite、Zod、brace-expansion、browserslist、js-yaml等の警告対象を宣言範囲内で更新する。
Drizzle CLIが古いesbuildを固定する経路は利用箇所と移行影響を確認する。
監査が提案するDrizzle CLIの大幅なダウングレードは実行しない。
更新に伴う機能変更やDBマイグレーションを混ぜない。

Drizzle CLIの設定読込に使われる `@esbuild-kit/core-utils` だけのesbuildを0.25系へ限定する。
既存の0.18系には開発サーバーからの読取の勧告がある。設定読込とSQL生成をローカルで検証し、DBへ適用しない。

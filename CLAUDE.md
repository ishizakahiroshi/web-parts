<!-- このファイルはプロジェクト固有ルールのみを書く。個人/グローバル AI ルール
（言語・確認スタイル・出力フォーマット等）は各 AI ツールのグローバル設定へ。
fresh public clone でも有効な内容に保つこと。 -->

# web-parts 開発ガイド

> **このファイルは索引であって本文ではない。** 全 AI セッションで全文がロードされるので、
> ルールの本文はここへ書かず、破る人が必ず開く場所（コード・検査スクリプト・skill・guide・台帳）へ置き、
> ここには索引の 1 行だけを残す。新しいルールを足す前に既存の CLAUDE.md・skill・guide・台帳を検索し、
> 正本が既にあれば参照だけにする。詳細は下記「設計原則の索引」。

## プロジェクト概要

複数の Web サービスで共通に使う部品の置き場。部品は `packages/` の下に 1 つずつ置き、使う側のサービスは版を指定して取り込む。部品を直しても、使う側が版を上げるまで動きは変わらない。

最初の部品は `@ishizakahiroshi/share-parts`（ページを人に送るボタン）。使い方と決まりは [`packages/share-parts/README.md`](packages/share-parts/README.md)。

## やらないこと（スコープ外）

- 部品に文言・色・サービスの名前を持たせない（使う側が渡す）
- 部品から通信をしない。計測・広告・SNS への投稿ボタンを入れない
- 使う側のサービスのコードをここへ持ち込まない（ここは部品だけ）

## 技術スタック

| 用途 | 中身 |
|---|---|
| 言語 | TypeScript 6 |
| 取りまとめ | pnpm 11 の workspace |
| 試験 | Vitest（画面の試験は jsdom） |
| 見た目 | React 19（任意）と素の DOM |

## ディレクトリ構成

- `packages/share-parts/src/` — 芯（`core.ts`）と見た目 2 種（`dom.ts`・`react.tsx`）
- `packages/share-parts/test/` — 試験。決まりの試験は `rules.test.ts`
- `packages/share-parts/examples/` — 見本のページ（値は作り物）
- `scripts/check-claude-md.mjs` — このファイルの構造検査

## 主要コマンド

- 型の検査: `pnpm typecheck`
- 試験: `pnpm test`
- ビルドと配る形の検査: `pnpm build` の後に `pnpm check:dist`
- 見本のページ: `pnpm --filter @ishizakahiroshi/share-parts examples`
- このファイルの検査: `node scripts/check-claude-md.mjs`

## 設計原則の索引（本文は正本にある）

| ルール | 正本（本文はここ） | 機械検査 |
|---|---|---|
| 通信をしない・投稿ボタンを持たない・経路は目的地だけ・URL は https だけ | `packages/share-parts/src/core.ts` の先頭 | `packages/share-parts/test/rules.test.ts` |
| 2 つの見た目は同じ判断を描くだけ（動きを分けない） | `packages/share-parts/src/core.ts` の `planButtons` | `packages/share-parts/test/dom.test.tsx` |
| 外部の URL の書き方は公式の資料で確かめ、確かめた日と出どころを残す | `packages/share-parts/README.md` の「知っておくこと」 | なし |
| 配る形は、まとめる道具なしでも動く（`dom.js` は隣の `core.js` だけを読み込む） | `packages/share-parts/scripts/check-dist.mjs` の先頭 | `pnpm check:dist`（CI） |
| npm へは、タグ `share-parts-v<版>` の push で CI から出す。トークンを置かない（Trusted Publishing） | `.github/workflows/release.yml` の先頭 | `scripts/check-release-workflow.mjs`（CI） |

**新しいルールを足す前に、まずこの表に 1 行足せる形にできないかを考える。**

## AI 作業共通ルール

ビルド・コミット禁止、secrets-scan 責務、plan/bugfix/pending md の作成ルール等の AI 作業共通ルールは、各利用者のグローバル AI 設定に従う（作者環境の例: `~/.claude/CLAUDE.md` および `~/.claude/guides/`）。

- 作業の branch は `develop`。`main` へ取り込むのと、版を出すのは持ち主が行う
- 試験と見本の値は作り物だけを使う（実在の学校・人・場所の値を入れない）

## Obsidian artifacts

If `docs/obsidian/README.md` exists, use it as an index for related knowledge artifacts.
Use the repository-relative `docs/obsidian` entry. Do not write to a central absolute
path and do not silently fall back to `docs/local` when the entry is missing.

## secrets-scan（このリポジトリの配線）

書く瞬間の責務（固有名詞の一般化・fixture は合成データ等）は上記「AI 作業共通ルール」の参照先に従う。このリポジトリ固有の配線は以下:

- scanner: doxguard（手動実行: `npx doxguard@0.2.1 scan --all-tracked --block --strict`）。監視語のリストはリポジトリの外に置く（`doxguard.config.json` は環境変数の参照だけを持つ）
- pre-commit: `.githooks/pre-commit`（clone した直後は `npx doxguard@0.2.1 install-hooks` で有効にする）
- CI: `.github/workflows/doxguard.yml`（構造パターンだけ。設定は `doxguard.ci.json`）と `.github/workflows/gitleaks.yml`（秘密の形の文字列）

## 関連ドキュメント

| 項目 | パス |
|---|---|
| ユーザー向け README | `README.md`・`packages/share-parts/README.md` |
| Codex/他 AI 用入口 | `AGENTS.md` |
| ローカル作業ノート（非公開） | `docs/local/`（存在する場合） |
| Obsidian knowledge artifacts | `docs/obsidian/`（存在する場合。作業キューではない） |

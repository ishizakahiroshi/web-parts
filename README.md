# web-parts

複数の Web サービスで共通に使う部品の置き場です。部品は `packages/` の下に 1 つずつ置き、使う側は版を指定して取り込みます。

| 部品 | 中身 |
|---|---|
| [`@ishizakahiroshi/share-parts`](packages/share-parts/README.md) | ページを人に送るボタン（共有・LINE・メール・経路）。通信をしない |

## 開発

```text
pnpm install
pnpm typecheck
pnpm test
```

## ライセンス

MIT

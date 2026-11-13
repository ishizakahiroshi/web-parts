# @ishizakahiroshi/share-parts

Share buttons without tracking. A framework-free core (native share with copy fallback, LINE, mail, destination-only route link) with thin React and DOM views. No network calls, no wording, no styles.

ページを人に送るためのボタンの部品です。芯は画面を持たない関数で、その上に React 用と素の JavaScript 用の薄い見た目が載っています。どちらの見た目も同じ関数の結果を描くだけなので、動きは同じになります。

## 入れ方

```text
pnpm add @ishizakahiroshi/share-parts
# または
npm install @ishizakahiroshi/share-parts
```

React 用の見た目（`/react`）を使うときだけ、React 18 以上が要ります。関数（`.`）と素の JavaScript 用（`/dom`）は、ほかに何も要りません。

## できること

| ボタン | 動き |
|---|---|
| 共有 | 端末の共有メニューを開く。使えない端末では、URL をクリップボードへコピーする |
| LINE で送る | 件名と URL が入った状態で、LINE の「送る相手を選ぶ」画面を開く |
| メールで送る | 件名と本文が入った状態で、メールを開く |
| 経路 | Google マップの経路を、目的地だけを渡して開く |

## 部品が守る決まり

- 通信をしない。外へ出るのは、利用者が押したリンクと、端末の共有メニューだけ
- 経路は目的地だけで作る。出発地を受け取る口が無い（利用者が設定した地点を外へ渡さないため）。出発地は Google マップの側が、端末の位置などから決める
- SNS へ投稿するためのボタンを持たない
- 共有する URL は https だけを通す（開発用に localhost の http は通す）
- 文言・色・形を持たない。文言とクラス名は使う側が渡す

決まりは `test/rules.test.ts` が確かめています。

## 使い方

### React

```tsx
import { ShareButtons } from '@ishizakahiroshi/share-parts/react'

<div className="row">
  <ShareButtons
    data={{ title: '見本の学校', url: 'https://example.com/school/000/' }}
    destination={{ lat: 35.5, lng: 135.25 }}
    items={[
      { kind: 'route', label: '経路（Google マップ）' },
      { kind: 'share', label: '共有' },
      { kind: 'line', label: 'LINE で送る' },
    ]}
    onResult={(result) => {
      // 'shared' | 'copied' | 'cancelled' | 'failed'。知らせの表示は使う側で行う。
      // 'cancelled' は利用者が共有メニューを閉じただけなので、何も出さなくてよい。
    }}
  />
</div>
```

包む要素は作らず、ボタン（`<button>`）とリンク（`<a>`）だけを並べて返します。描く時点ではブラウザの機能を調べないので、先に HTML を作って配るページでも、後から描いた結果と食い違いません。

### 素の JavaScript

```js
import { mountShareButtons } from '@ishizakahiroshi/share-parts/dom'

const unmount = mountShareButtons(document.querySelector('#row'), {
  data: { title: '見本の学校', url: 'https://example.com/school/000/' },
  destination: { lat: 35.5, lng: 135.25 },
  items: [
    { kind: 'share', label: '共有', className: 'chip' },
    { kind: 'line', label: 'LINE で送る', className: 'chip' },
  ],
  onResult: (result) => { /* 知らせを出す */ },
})
// 中身を変えたいときは unmount() してから作り直す。
```

まとめる道具（バンドラー）を使わないサイトでは、配っているフォルダの `dist/core.js` と `dist/dom.js` の 2 つを同じフォルダへ写して、`dom.js` を読み込みます（`dom.js` は隣の `core.js` だけを読み込みます）。`LICENSE` も一緒に置いてください。

### 関数だけを使う

```js
import { shareOrCopy, lineShareUrl, mailShareUrl, routeUrl } from '@ishizakahiroshi/share-parts'

const result = await shareOrCopy({ title: '見本の学校', url: 'https://example.com/school/000/' })
lineShareUrl('送る文')                // https://line.me/R/share?text=...
mailShareUrl('件名', '本文')          // mailto:?subject=...&body=...
routeUrl({ lat: 35.5, lng: 135.25 })  // https://www.google.com/maps/dir/?api=1&destination=35.5%2C135.25
```

`shareOrCopy` は、ボタンを押した操作の中から呼んでください（ブラウザの決まりです）。

## 設定

| 項目 | 中身 |
|---|---|
| `data` | `title`・`text`・`url`。あるものだけを使う |
| `items` | 並べるボタン。`kind`（`share`・`line`・`mail`・`route`）、`label`（文言）、`className`（省ける）。書いた順に並ぶ |
| `destination` | 経路の目的地（`lat`・`lng`）。無い・範囲の外のときは、経路のボタンを出さない |
| `mailSubject` | メールの件名。省くと `data.title` |
| `onResult` | 「共有」を押した結果を受け取る |

コピーされるのは本文と URL です（URL だけを渡せば、URL だけがコピーされます）。LINE とメールには、件名・本文・URL を改行でつないだ文が入ります。

## 知っておくこと

- 「LINE で送る」が開くのは、スマホ（iOS・Android）の LINE です。PC の LINE は対象外です
- 端末の共有メニューは、使えないブラウザがあります。そのときはコピーになります
- 経路の出発地は Google マップが決めます。端末の位置が分からないときは、出発地の欄が空で開きます

URL の書き方は、次の公式の資料を 2026-11-14 に確かめたものです。

- LINE: https://developers.line.biz/en/docs/line-login/using-line-url-scheme/
- Google マップ: https://developers.google.com/maps/documentation/urls/get-started
- 共有メニュー: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

## 開発

```text
pnpm install
pnpm typecheck
pnpm test
pnpm build && pnpm check:dist                         # ビルドして、配る形を検査する
pnpm --filter @ishizakahiroshi/share-parts examples   # 見本のページを開く
```

## ライセンス

MIT

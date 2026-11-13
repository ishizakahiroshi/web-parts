/**
 * React 用の見た目。包む要素を作らず、ボタンとリンクだけを並べて返す
 * （使う側の行の中に、そのまま置けるようにするため）。
 * 何を並べるかの判断は core.ts の planButtons にあり、ここは描くだけ。
 *
 * 描く時点でブラウザの機能を調べない。共有メニューが使えるかは、押したときに
 * shareOrCopy が調べる。先に HTML を作って配るページでも、後から描いた結果と食い違わない。
 */
import type { ReactElement } from 'react'
import { planButtons, shareOrCopy, type ShareButtonsOptions } from './core.js'

export type {
  ButtonSpec,
  LatLng,
  ShareButtonItem,
  ShareButtonKind,
  ShareButtonsOptions,
  ShareData,
  ShareEnv,
  ShareResult,
} from './core.js'

export function ShareButtons(props: ShareButtonsOptions): ReactElement {
  const { data, env, onResult } = props
  return (
    <>
      {planButtons(props).map((spec, index) =>
        spec.href === undefined ? (
          <button
            key={`${spec.kind}-${index}`}
            type="button"
            className={spec.className}
            onClick={() => {
              void shareOrCopy(data, env).then((result) => onResult?.(result))
            }}
          >
            {spec.label}
          </button>
        ) : (
          <a
            key={`${spec.kind}-${index}`}
            href={spec.href}
            className={spec.className}
            target={spec.newTab ? '_blank' : undefined}
            rel={spec.newTab ? 'noopener noreferrer' : undefined}
          >
            {spec.label}
          </a>
        ),
      )}
    </>
  )
}

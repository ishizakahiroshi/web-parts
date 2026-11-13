/**
 * 素の JavaScript 用の見た目。渡された要素の中に、ボタンとリンクを作る。
 * 何を並べるかの判断は core.ts の planButtons にあり、ここは描くだけ。
 */
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

/**
 * container の末尾にボタンを足す。戻り値を呼ぶと、足したボタンを取り除く。
 * 中身を変えたいときは、取り除いてから作り直す。
 */
export function mountShareButtons(container: Element, options: ShareButtonsOptions): () => void {
  const doc = container.ownerDocument
  const created: Element[] = []
  for (const spec of planButtons(options)) {
    let element: HTMLElement
    if (spec.href === undefined) {
      const button = doc.createElement('button')
      button.type = 'button'
      if (spec.className) button.className = spec.className
      button.addEventListener('click', () => {
        void shareOrCopy(options.data, options.env).then((result) => options.onResult?.(result))
      })
      element = button
    } else {
      const link = doc.createElement('a')
      link.href = spec.href
      if (spec.className) link.className = spec.className
      if (spec.newTab) {
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
      }
      element = link
    }
    // 文言は文字として入れる（HTML として解釈させない）。
    element.textContent = spec.label
    container.appendChild(element)
    created.push(element)
  }
  return () => {
    for (const element of created) element.remove()
    created.length = 0
  }
}

import type { ShareButtonsOptions, ShareEnv, ShareResult } from '../src/core.js'

/** 見本に使う値。すべて作り物（example.com は例示用に予約されたドメイン）。 */
export const sampleOptions: ShareButtonsOptions = {
  data: { title: '見本の学校', url: 'https://example.com/school/000/' },
  destination: { lat: 35.5, lng: 135.25 },
  items: [
    { kind: 'route', label: '経路（Google マップ）', className: 'chip' },
    { kind: 'share', label: '共有', className: 'chip' },
    { kind: 'line', label: 'LINE で送る', className: 'chip' },
    { kind: 'mail', label: 'メールで送る', className: 'chip' },
  ],
}

/** 知らせの文言は、使う側が持つ。 */
export const resultText: Record<ShareResult, string> = {
  shared: '共有しました',
  copied: 'リンクをコピーしました',
  cancelled: '',
  failed: '共有できませんでした',
}

/** 「共有メニューが無い端末」を試すための入口。コピーだけができる。 */
export function copyOnlyEnv(): ShareEnv {
  return { writeText: (text) => navigator.clipboard.writeText(text) }
}

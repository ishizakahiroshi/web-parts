/**
 * share-parts の芯。画面を持たず、ほかのパッケージに依存しない。
 *
 * このファイルが守る決まり（試験は test/rules.test.ts と test/core.test.ts）:
 * - 通信をしない。外へ出るのは、利用者が押したリンクと、端末の共有メニューだけ。
 * - 経路の URL は目的地だけで作る。出発地（利用者が設定した地点など）を受け取る口を持たない。
 * - SNS へ投稿するための URL を作る関数を持たない。
 * - 共有する URL は https だけを通す（開発用に localhost の http は通す）。
 *
 * 外部の URL の書き方は、次の公式の資料を 2026-11-14 に確かめたもの:
 * - LINE:        https://developers.line.biz/en/docs/line-login/using-line-url-scheme/
 * - Google Maps: https://developers.google.com/maps/documentation/urls/get-started
 * - Web Share:   https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
 */

/** 共有する中身。少なくとも 1 つを入れる。 */
export interface ShareData {
  /** 件名や学校名など。共有メニューとメールの件名、LINE の文の 1 行目に使う。 */
  title?: string
  /** 本文。 */
  text?: string
  /** ページの URL。https だけを通す。 */
  url?: string
}

/**
 * 共有の結果。
 * - shared: 端末の共有メニューで共有した
 * - copied: 共有メニューが使えなかったので、クリップボードへコピーした
 * - cancelled: 利用者が共有メニューを閉じた（失敗ではない。何も表示しなくてよい）
 * - failed: 共有もコピーもできなかった
 */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** 端末の機能への入口。省くとブラウザの navigator を使う。試験では差し替える。 */
export interface ShareEnv {
  share?: (data: ShareData) => Promise<void>
  writeText?: (text: string) => Promise<void>
}

/** 目的地。緯度と経度だけ。 */
export interface LatLng {
  lat: number
  lng: number
}

export type ShareButtonKind = 'share' | 'line' | 'mail' | 'route'

/** 並べるボタン 1 個。文言は使う側が渡す（部品は文言を持たない）。 */
export interface ShareButtonItem {
  kind: ShareButtonKind
  label: string
  className?: string
}

export interface ShareButtonsOptions {
  data: ShareData
  /** 並べる順に書く。 */
  items: readonly ShareButtonItem[]
  /** メールの件名。省くと data.title。 */
  mailSubject?: string
  /** 経路の目的地。無い・範囲の外のときは、経路のボタンを出さない。 */
  destination?: LatLng | null
  /** 「共有」を押した結果。知らせの表示は使う側で行う。 */
  onResult?: (result: ShareResult) => void
  env?: ShareEnv
}

/** 描くボタン 1 個の中身。href があるものはリンク、無いものはボタン。 */
export interface ButtonSpec {
  kind: ShareButtonKind
  label: string
  className?: string
  href?: string
  newTab: boolean
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** 共有してよい URL か。https だけ（開発用に localhost の http は通す）。ID やパスワード入りの URL は通さない。 */
export function isAllowedUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.username !== '' || parsed.password !== '') return false
  if (parsed.protocol === 'https:') return true
  return parsed.protocol === 'http:' && LOCAL_HOSTS.has(parsed.hostname)
}

/** 前後の空白を落とし、空の項目と、通せない URL を外す。 */
export function cleanShareData(data: ShareData): ShareData {
  const out: ShareData = {}
  const title = data.title?.trim()
  const text = data.text?.trim()
  const url = data.url?.trim()
  if (title) out.title = title
  if (text) out.text = text
  if (url && isAllowedUrl(url)) out.url = url
  return out
}

/** LINE やメールの本文にする文。件名・本文・URL を、あるものだけ改行でつなぐ。 */
export function messageText(data: ShareData): string {
  const d = cleanShareData(data)
  return [d.title, d.text, d.url].filter((part): part is string => Boolean(part)).join('\n')
}

/** コピーする文。本文と URL だけ（URL だけなら URL だけがコピーされる）。 */
export function copyText(data: ShareData): string {
  const d = cleanShareData(data)
  return [d.text, d.url].filter((part): part is string => Boolean(part)).join('\n')
}

function defaultEnv(): ShareEnv {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  const env: ShareEnv = {}
  if (!nav) return env
  if (typeof nav.share === 'function') env.share = (data) => nav.share(data)
  const clipboard = nav.clipboard
  if (clipboard && typeof clipboard.writeText === 'function') env.writeText = (text) => clipboard.writeText(text)
  return env
}

function isAbort(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError'
}

/**
 * 端末の共有メニューを開く。使えないときはクリップボードへコピーする。
 * ボタンを押した操作の中から呼ぶこと（ブラウザの決まり）。
 */
export async function shareOrCopy(data: ShareData, env: ShareEnv = defaultEnv()): Promise<ShareResult> {
  const d = cleanShareData(data)
  // URL を渡されたのに通せなかったときは、件名だけを共有したりせず、失敗にする。
  if (data.url?.trim() && !d.url) return 'failed'
  if (!d.title && !d.text && !d.url) return 'failed'
  if (env.share) {
    try {
      await env.share(d)
      return 'shared'
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      // 共有メニューが開けなかったときは、コピーを試す。
    }
  }
  const text = copyText(d)
  if (!env.writeText || !text) return 'failed'
  try {
    await env.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** LINE の「送る相手を選ぶ」画面を開く URL。対象はスマホの LINE（PC の LINE は対象外）。 */
export function lineShareUrl(text: string): string {
  return 'https://line.me/R/share?text=' + encodeURIComponent(text)
}

/** メールを開く URL。件名と本文だけ（宛先は入れない）。 */
export function mailShareUrl(subject: string, body: string): string {
  return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
}

/**
 * Google マップの経路を開く URL。渡すのは目的地だけ。
 * 出発地は Google マップの側が、端末の位置などから決める。
 * 緯度・経度が数でない・範囲の外のときは null。
 */
export function routeUrl(destination: LatLng): string | null {
  const { lat, lng } = destination
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}`
}

/**
 * 並べるボタンの中身を決める。React 用と DOM 用の見た目は、どちらもこの結果を描くだけ
 * （2 つの見た目で動きが違ってこないように、判断はここ 1 か所に置く）。
 */
export function planButtons(options: ShareButtonsOptions): ButtonSpec[] {
  const message = messageText(options.data)
  const specs: ButtonSpec[] = []
  for (const item of options.items) {
    const base: ButtonSpec = { kind: item.kind, label: item.label, newTab: false }
    if (item.className) base.className = item.className
    if (item.kind === 'share') {
      specs.push(base)
    } else if (item.kind === 'line') {
      if (message) specs.push({ ...base, href: lineShareUrl(message), newTab: true })
    } else if (item.kind === 'mail') {
      const subject = (options.mailSubject ?? options.data.title ?? '').trim()
      if (message) specs.push({ ...base, href: mailShareUrl(subject, message) })
    } else if (item.kind === 'route') {
      const href = options.destination ? routeUrl(options.destination) : null
      if (href) specs.push({ ...base, href, newTab: true })
    }
  }
  return specs
}

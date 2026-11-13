import { describe, expect, it, vi } from 'vitest'
import {
  cleanShareData,
  copyText,
  isAllowedUrl,
  lineShareUrl,
  mailShareUrl,
  messageText,
  planButtons,
  routeUrl,
  shareOrCopy,
  type ShareEnv,
} from '../src/core.js'

// 例に使う値はすべて作り物（example.com は例示用に予約されたドメイン）。
const PAGE = 'https://example.com/school/000/'

function abortError(): Error {
  const error = new Error('cancelled')
  error.name = 'AbortError'
  return error
}

describe('isAllowedUrl', () => {
  it('https だけを通す', () => {
    expect(isAllowedUrl(PAGE)).toBe(true)
    expect(isAllowedUrl('http://example.com/')).toBe(false)
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedUrl('data:text/html,x')).toBe(false)
    expect(isAllowedUrl('/school/000/')).toBe(false)
    expect(isAllowedUrl('')).toBe(false)
  })

  it('開発用に localhost の http は通す', () => {
    expect(isAllowedUrl('http://localhost:5173/school/000/')).toBe(true)
    expect(isAllowedUrl('http://127.0.0.1:5173/')).toBe(true)
    expect(isAllowedUrl('http://localhost.example.com/')).toBe(false)
  })

  it('ID やパスワード入りの URL は通さない', () => {
    expect(isAllowedUrl('https://user:pass@example.com/')).toBe(false)
    expect(isAllowedUrl('https://user@example.com/')).toBe(false)
  })
})

describe('文の組み立て', () => {
  it('空の項目と通せない URL を外す', () => {
    expect(cleanShareData({ title: ' 見本の学校 ', text: '', url: 'http://example.com/' })).toEqual({ title: '見本の学校' })
  })

  it('LINE・メール用は、件名・本文・URL を改行でつなぐ', () => {
    expect(messageText({ title: '見本の学校', url: PAGE })).toBe(`見本の学校\n${PAGE}`)
    expect(messageText({ title: 'a', text: 'b', url: PAGE })).toBe(`a\nb\n${PAGE}`)
    expect(messageText({})).toBe('')
  })

  it('コピー用は、本文と URL だけ（件名は入れない）', () => {
    expect(copyText({ title: '見本の学校', url: PAGE })).toBe(PAGE)
    expect(copyText({ title: 'a', text: 'b', url: PAGE })).toBe(`b\n${PAGE}`)
  })
})

describe('shareOrCopy', () => {
  it('共有メニューが使えるときは、それで共有する', async () => {
    const share = vi.fn(async () => {})
    const writeText = vi.fn(async () => {})
    await expect(shareOrCopy({ title: '見本の学校', url: PAGE }, { share, writeText })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: '見本の学校', url: PAGE })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('利用者が共有メニューを閉じたときは cancelled で、コピーもしない', async () => {
    const writeText = vi.fn(async () => {})
    const env: ShareEnv = { share: async () => { throw abortError() }, writeText }
    await expect(shareOrCopy({ url: PAGE }, env)).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('共有メニューが無いときは、コピーに落ちる', async () => {
    const writeText = vi.fn(async () => {})
    await expect(shareOrCopy({ title: '見本の学校', url: PAGE }, { writeText })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(PAGE)
  })

  it('共有メニューが開けなかったときも、コピーに落ちる', async () => {
    const writeText = vi.fn(async () => {})
    const env: ShareEnv = { share: async () => { throw new TypeError('cannot share') }, writeText }
    await expect(shareOrCopy({ url: PAGE }, env)).resolves.toBe('copied')
  })

  it('共有もコピーもできないときは failed', async () => {
    await expect(shareOrCopy({ url: PAGE }, {})).resolves.toBe('failed')
    await expect(shareOrCopy({ url: PAGE }, { writeText: async () => { throw new Error('denied') } })).resolves.toBe('failed')
  })

  it('通せない URL を渡されたら、件名だけを共有したりせず failed', async () => {
    const share = vi.fn(async () => {})
    const writeText = vi.fn(async () => {})
    await expect(shareOrCopy({ title: '見本の学校', url: 'http://example.com/' }, { share, writeText })).resolves.toBe('failed')
    expect(share).not.toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('中身が無いときは failed', async () => {
    await expect(shareOrCopy({}, { share: async () => {} })).resolves.toBe('failed')
  })

  it('件名だけのときは、コピーするものが無いので共有メニューが無ければ failed', async () => {
    const writeText = vi.fn(async () => {})
    await expect(shareOrCopy({ title: '見本の学校' }, { writeText })).resolves.toBe('failed')
    expect(writeText).not.toHaveBeenCalled()
  })
})

describe('URL を作る関数', () => {
  it('LINE は公式の形（R/share?text=）で、文をパーセントエンコードする', () => {
    expect(lineShareUrl('a b')).toBe('https://line.me/R/share?text=a%20b')
    expect(lineShareUrl('見本\nhttps://example.com/?a=1&b=2')).toBe(
      'https://line.me/R/share?text=%E8%A6%8B%E6%9C%AC%0Ahttps%3A%2F%2Fexample.com%2F%3Fa%3D1%26b%3D2',
    )
  })

  it('メールは件名と本文だけ', () => {
    expect(mailShareUrl('件名', 'x&y')).toBe('mailto:?subject=%E4%BB%B6%E5%90%8D&body=x%26y')
  })

  it('経路は目的地だけを渡す', () => {
    expect(routeUrl({ lat: 35.5, lng: 135.25 })).toBe('https://www.google.com/maps/dir/?api=1&destination=35.5%2C135.25')
    expect(routeUrl({ lat: -33.5, lng: -70.25 })).toBe('https://www.google.com/maps/dir/?api=1&destination=-33.5%2C-70.25')
  })

  it('経路は、数でない・範囲の外の目的地では作らない', () => {
    expect(routeUrl({ lat: Number.NaN, lng: 135 })).toBeNull()
    expect(routeUrl({ lat: 91, lng: 135 })).toBeNull()
    expect(routeUrl({ lat: 35, lng: 181 })).toBeNull()
    expect(routeUrl({ lat: Number.POSITIVE_INFINITY, lng: 0 })).toBeNull()
    expect(routeUrl({ lat: '35', lng: '135' } as unknown as { lat: number; lng: number })).toBeNull()
  })
})

describe('planButtons', () => {
  const data = { title: '見本の学校', url: PAGE }

  it('渡した順に並べ、リンクには行き先を入れる', () => {
    const specs = planButtons({
      data,
      destination: { lat: 35.5, lng: 135.25 },
      items: [
        { kind: 'route', label: '経路' },
        { kind: 'share', label: '共有', className: 'chip' },
        { kind: 'line', label: 'LINE で送る' },
        { kind: 'mail', label: 'メールで送る' },
      ],
    })
    expect(specs).toEqual([
      { kind: 'route', label: '経路', href: 'https://www.google.com/maps/dir/?api=1&destination=35.5%2C135.25', newTab: true },
      { kind: 'share', label: '共有', className: 'chip', newTab: false },
      { kind: 'line', label: 'LINE で送る', href: lineShareUrl(`見本の学校\n${PAGE}`), newTab: true },
      { kind: 'mail', label: 'メールで送る', href: mailShareUrl('見本の学校', `見本の学校\n${PAGE}`), newTab: false },
    ])
  })

  it('目的地が無い・使えないときは、経路のボタンを出さない', () => {
    const items = [{ kind: 'route', label: '経路' } as const]
    expect(planButtons({ data, items })).toEqual([])
    expect(planButtons({ data, items, destination: null })).toEqual([])
    expect(planButtons({ data, items, destination: { lat: 999, lng: 0 } })).toEqual([])
  })

  it('送る中身が無いときは、LINE とメールのボタンを出さない', () => {
    const specs = planButtons({ data: {}, items: [{ kind: 'line', label: 'LINE' }, { kind: 'mail', label: 'メール' }] })
    expect(specs).toEqual([])
  })

  it('メールの件名は、指定があればそれを使う', () => {
    const [spec] = planButtons({ data, mailSubject: '学校の候補', items: [{ kind: 'mail', label: 'メール' }] })
    expect(spec?.href).toBe(mailShareUrl('学校の候補', `見本の学校\n${PAGE}`))
  })
})

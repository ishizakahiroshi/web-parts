// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { lineShareUrl, type ShareButtonsOptions } from '../src/core.js'
import { mountShareButtons } from '../src/dom.js'
import { ShareButtons } from '../src/react.js'

const PAGE = 'https://example.com/school/000/'

function options(extra: Partial<ShareButtonsOptions> = {}): ShareButtonsOptions {
  return {
    data: { title: '見本の学校', url: PAGE },
    destination: { lat: 35.5, lng: 135.25 },
    items: [
      { kind: 'route', label: '経路（Google マップ）' },
      { kind: 'share', label: '共有', className: 'chip' },
      { kind: 'line', label: 'LINE で送る', className: 'chip' },
      { kind: 'mail', label: 'メールで送る' },
    ],
    ...extra,
  }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('mountShareButtons', () => {
  it('渡した順に、ボタンとリンクを作る', () => {
    const box = document.createElement('div')
    mountShareButtons(box, options())
    const [route, share, line, mail] = [...box.children] as HTMLElement[]
    expect(box.children.length).toBe(4)
    expect(route?.tagName).toBe('A')
    expect(route?.getAttribute('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=35.5%2C135.25')
    expect(route?.getAttribute('target')).toBe('_blank')
    expect(route?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(share?.tagName).toBe('BUTTON')
    expect(share?.getAttribute('type')).toBe('button')
    expect(share?.className).toBe('chip')
    expect(share?.textContent).toBe('共有')
    expect(line?.getAttribute('href')).toBe(lineShareUrl(`見本の学校\n${PAGE}`))
    expect(mail?.getAttribute('href')?.startsWith('mailto:?subject=')).toBe(true)
    expect(mail?.hasAttribute('target')).toBe(false)
  })

  it('「共有」を押すと、共有して結果を知らせる', async () => {
    const share = vi.fn(async () => {})
    const onResult = vi.fn()
    const box = document.createElement('div')
    mountShareButtons(box, options({ env: { share }, onResult, items: [{ kind: 'share', label: '共有' }] }))
    ;(box.firstElementChild as HTMLButtonElement).click()
    await settle()
    expect(share).toHaveBeenCalledWith({ title: '見本の学校', url: PAGE })
    expect(onResult).toHaveBeenCalledWith('shared')
  })

  it('共有メニューが無いときは、コピーして結果を知らせる', async () => {
    const writeText = vi.fn(async () => {})
    const onResult = vi.fn()
    const box = document.createElement('div')
    mountShareButtons(box, options({ env: { writeText }, onResult, items: [{ kind: 'share', label: '共有' }] }))
    ;(box.firstElementChild as HTMLButtonElement).click()
    await settle()
    expect(writeText).toHaveBeenCalledWith(PAGE)
    expect(onResult).toHaveBeenCalledWith('copied')
  })

  it('文言は文字として入り、HTML として解釈されない', () => {
    const box = document.createElement('div')
    mountShareButtons(box, options({ items: [{ kind: 'share', label: '<img src=x onerror=alert(1)>' }] }))
    expect(box.querySelector('img')).toBeNull()
    expect(box.firstElementChild?.textContent).toBe('<img src=x onerror=alert(1)>')
  })

  it('戻り値を呼ぶと、足したボタンだけを取り除く', () => {
    const box = document.createElement('div')
    const existing = document.createElement('span')
    box.appendChild(existing)
    const unmount = mountShareButtons(box, options())
    expect(box.children.length).toBe(5)
    unmount()
    expect([...box.children]).toEqual([existing])
  })
})

describe('React 用と DOM 用の見た目', () => {
  it('同じ設定から、同じ HTML ができる', () => {
    const box = document.createElement('div')
    mountShareButtons(box, options())
    expect(renderToStaticMarkup(<ShareButtons {...options()} />)).toBe(box.innerHTML)
  })

  it('目的地が無いときは、どちらも経路のボタンを出さない', () => {
    const box = document.createElement('div')
    mountShareButtons(box, options({ destination: null }))
    const html = renderToStaticMarkup(<ShareButtons {...options({ destination: null })} />)
    expect(html).toBe(box.innerHTML)
    expect(html).not.toContain('google.com')
  })
})

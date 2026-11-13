/**
 * 部品が守る決まりの試験。動きではなく「持っていないこと」を確かめる。
 * 決まりの本文は src/core.ts の先頭にある。
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as core from '../src/core.js'

const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
const sources = readdirSync(srcDir)
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => ({ name, text: readFileSync(join(srcDir, name), 'utf8') }))

/** コメントを外した本体。決まりを説明する文に出てくる語で、試験が落ちないようにする。 */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('部品の決まり', () => {
  it('ソースが 3 つある（芯・DOM・React）', () => {
    expect(sources.map((s) => s.name).sort()).toEqual(['core.ts', 'dom.ts', 'react.tsx'])
  })

  it('通信の呼び出しを持たない', () => {
    const forbidden = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /EventSource/, /\bimport\s*\(/, /new\s+Image\b/]
    for (const { name, text } of sources) {
      for (const pattern of forbidden) {
        expect(pattern.test(code(text)), `${name} に ${pattern} がある`).toBe(false)
      }
    }
  })

  it('外の行き先は LINE・Google マップ・メールだけ', () => {
    const hosts = new Set<string>()
    for (const { text } of sources) {
      for (const match of code(text).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) hosts.add(match[1]!.toLowerCase())
    }
    expect([...hosts].sort()).toEqual(['line.me', 'www.google.com'])
  })

  it('SNS へ投稿する関数を持たない（芯が外へ出す関数は決まった 9 個だけ）', () => {
    expect(Object.keys(core).sort()).toEqual([
      'cleanShareData',
      'copyText',
      'isAllowedUrl',
      'lineShareUrl',
      'mailShareUrl',
      'messageText',
      'planButtons',
      'routeUrl',
      'shareOrCopy',
    ].sort())
  })

  it('経路の関数は目的地 1 つしか受け取らず、余分な値を渡しても URL に入らない', () => {
    expect(core.routeUrl.length).toBe(1)
    const sneaky = { lat: 35.5, lng: 135.25, origin: '36.1,139.9', home: { lat: 36.1, lng: 139.9 } }
    const url = core.routeUrl(sneaky)
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=35.5%2C135.25')
    expect(url).not.toContain('origin')
    expect(url).not.toContain('36.1')
  })

  it('ボタンの中身を決める関数は、設定の中の余分な位置を URL に入れない', () => {
    const options = {
      data: { title: '見本の学校', url: 'https://example.com/school/000/' },
      destination: { lat: 35.5, lng: 135.25 },
      items: [{ kind: 'route' as const, label: '経路' }],
      origin: { lat: 36.1, lng: 139.9 },
    }
    const [spec] = core.planButtons(options)
    expect(spec?.href).not.toContain('36.1')
  })
})

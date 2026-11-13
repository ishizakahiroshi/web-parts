#!/usr/bin/env node
// 配る形（dist）の検査。ビルドの後に実行する。
//
// なぜ要るか:
// まとめる道具（バンドラー）を使わないサイトは、dist/core.js と dist/dom.js の 2 つを
// 同じフォルダへ写して使う（README の「素の JavaScript」）。そのため、
// - core.js は何も読み込まない
// - dom.js は隣の core.js だけを読み込む
// が崩れると、そのサイトだけ動かなくなる。型の検査や試験（src を見る）では気づけない。
//
// exit 0 = 問題なし / exit 1 = 問題あり。

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const problems = []

const expectedFiles = ['core.d.ts', 'core.js', 'dom.d.ts', 'dom.js', 'react.d.ts', 'react.js']
let files = []
try {
  files = readdirSync(dist).sort()
} catch {
  problems.push('dist がありません。先に pnpm run build を実行してください')
}
if (files.length > 0 && JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
  problems.push(`dist の中身が想定と違います: ${files.join(', ')}（想定: ${expectedFiles.join(', ')}）`)
}

/** ファイルが読み込んでいる先（import ... from '...' と export ... from '...'）を集める。 */
function importsOf(name) {
  const text = readFileSync(join(dist, name), 'utf8')
  return [...text.matchAll(/^\s*(?:import|export)\b[^'"\n]*\bfrom\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]).sort()
}

const expectedImports = {
  'core.js': [],
  'dom.js': ['./core.js'],
  'react.js': ['./core.js', 'react/jsx-runtime'],
}

if (problems.length === 0) {
  for (const [name, expected] of Object.entries(expectedImports)) {
    const actual = importsOf(name)
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(`${name} の読み込み先が想定と違います: [${actual.join(', ')}]（想定: [${expected.join(', ')}]）`)
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`NG: ${problem}`)
  process.exit(1)
}
console.log(`OK: dist は ${expectedFiles.length} ファイルで、読み込み先は想定どおり`)

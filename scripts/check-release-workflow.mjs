#!/usr/bin/env node
// リリース用の workflow（.github/workflows/release.yml）の決まりを検査する。
//
// npm へは Trusted Publishing（GitHub Actions の OIDC）で出す。長く生きるトークンを置くと、
// 漏れたときに誰でもこの部品の新しい版を出せてしまうので、トークンを参照する書き方が入ったら落とす。
// OIDC が使われる条件（id-token: write・Node 22.14 以上・npm 11.5.1 以上）が外れても落とす。
import { readFileSync } from 'node:fs'

const path = new URL('../.github/workflows/release.yml', import.meta.url)
const text = readFileSync(path, 'utf8')
// コメントに書いた言葉で誤って落とさないよう、コメントは外して調べる
const code = text.split('\n').map((line) => line.replace(/(^|\s)#.*$/, '')).join('\n')

const problems = []
for (const banned of ['NPM_TOKEN', 'NODE_AUTH_TOKEN', '_authToken', 'secrets.']) {
  if (code.includes(banned)) problems.push(`トークンを参照する書き方が入っている: ${banned}`)
}
if (!/^\s*id-token:\s*write\s*$/m.test(code)) problems.push('id-token: write が無い（OIDC が使えない）')
if (!/node-version:\s*'24'/.test(code)) problems.push("node-version: '24' が無い（Trusted Publishing は Node 22.14 以上）")
if (!/npm install -g npm@\^11\.5\.1/.test(code)) problems.push('npm を 11.5.1 以上にする手順が無い')
if (/registry-url:/.test(code)) problems.push('registry-url を指定している（setup-node がトークン用の設定を書くので、指定しない）')
if (!/tags:\s*\['share-parts-v\*\.\*\.\*'\]/.test(code)) problems.push('タグの形（share-parts-v*.*.*）が変わっている')

if (problems.length > 0) {
  for (const problem of problems) console.error(`NG: ${problem}`)
  process.exit(1)
}
console.log('OK: release.yml はトークンを参照せず、OIDC の条件がそろっている')

import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ShareResult } from '../src/core.js'
import { ShareButtons } from '../src/react.js'
import { copyOnlyEnv, resultText, sampleOptions } from './sample.js'

function App() {
  const [result, setResult] = useState<ShareResult | null>(null)
  const [copyOnly, setCopyOnly] = useState(false)
  return (
    <>
      <h1>React で使う</h1>
      <div id="row" className="row">
        <ShareButtons {...sampleOptions} {...(copyOnly ? { env: copyOnlyEnv() } : {})} onResult={setResult} />
      </div>
      <p id="result" role="status">{result ? resultText[result] : ''}</p>
      <label>
        <input id="copy-only" type="checkbox" checked={copyOnly} onChange={(e) => setCopyOnly(e.target.checked)} />{' '}
        共有メニューが無い端末として試す（コピーになる）
      </label>
      <p><a href="./">見本の一覧へ</a></p>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('見本のページの要素が足りません')
createRoot(root).render(<App />)

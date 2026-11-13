import { mountShareButtons } from '../src/dom.js'
import { copyOnlyEnv, resultText, sampleOptions } from './sample.js'

const row = document.getElementById('row')
const result = document.getElementById('result')
const copyOnly = document.getElementById('copy-only')
if (!row || !result || !(copyOnly instanceof HTMLInputElement)) throw new Error('見本のページの要素が足りません')

let unmount = (): void => {}

function draw(): void {
  unmount()
  unmount = mountShareButtons(row!, {
    ...sampleOptions,
    ...(copyOnly instanceof HTMLInputElement && copyOnly.checked ? { env: copyOnlyEnv() } : {}),
    onResult: (r) => {
      result!.textContent = resultText[r]
    },
  })
}

copyOnly.addEventListener('change', draw)
draw()

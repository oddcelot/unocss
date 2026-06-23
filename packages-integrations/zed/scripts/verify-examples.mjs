#!/usr/bin/env node
// Boots the real @unocss/language-server (built dist) against each example,
// opens a representative file, enables semantic tokens, and prints how many
// `unocss` tokens the server emits. This is the Zed extension's underline
// feature exercised end-to-end without needing the editor.
//
// Run from the repo root, after `pnpm build`:
//   node packages-integrations/zed/scripts/verify-examples.mjs
//
// Token count > 0 means the server resolved a config and matched utilities in
// that file — i.e. completion/hover/colors/underline will work in Zed too.

import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const SERVER = 'packages-integrations/language-server/bin/unocss-language-server.js'

// Curated: example → a file that uses UnoCSS utilities, plus its Zed languageId.
const WORKS = [
  ['astro', 'src/pages/index.astro', 'astro'],
  ['astro-vue', 'src/pages/index.astro', 'astro'],
  ['next', 'app/page.tsx', 'typescriptreact'],
  ['remix', 'app/routes/_index.tsx', 'typescriptreact'],
  ['nuxt3', 'app.vue', 'vue'],
  ['sveltekit', 'src/routes/+page.svelte', 'svelte'],
  ['sveltekit-preprocess', 'src/routes/+page.svelte', 'svelte'],
  ['vite-angular', 'src/app/app.component.html', 'html'],
  ['vite-lightningcss', 'index.html', 'html'],
  ['vite-lit', 'src/my-element.ts', 'typescript'],
  ['vite-svelte', 'src/App.svelte', 'svelte'],
  ['vite-svelte-postcss', 'src/App.svelte', 'svelte'],
  ['vite-svelte-scoped', 'src/App.svelte', 'svelte'],
  ['vite-vue3', 'src/App.vue', 'vue'],
  ['vite-vue3-postcss', 'src/App.vue', 'vue'],
  ['vite-vue3-scoped', 'src/App.vue', 'vue'],
  // These ship a uno.config.ts (mirroring their vite.config.ts) so the server
  // resolves presetAttributify and highlights attributify syntax (bg="…").
  ['vite-react', 'src/App.tsx', 'typescriptreact'],
  ['vite-preact', 'src/app.tsx', 'typescriptreact'],
  ['vite-solid', 'src/App.tsx', 'typescriptreact'],
  ['vite-watch-mode', 'src/App.tsx', 'typescriptreact'],
  // Also ship a uno.config.ts, mirroring the config that otherwise lives only
  // in vite.config.ts / quasar.config.js, so the server resolves presets
  // without booting the full Qwik/Quasar toolchain.
  ['qwik', 'src/routes/index.tsx', 'typescriptreact'],
  ['quasar', 'src/pages/IndexPage.vue', 'vue'],
  // These resolve config from external presets / build-generated files, so they
  // need their own deps installed first (`pnpm install` inside the example,
  // which also runs `nuxi prepare` for nuxt3-layers). The 4th tuple element is a
  // prerequisite path; if it's missing the example is skipped with a hint
  // instead of reported as a failure.
  ['nuxt3-layers', 'app.vue', 'vue', '.nuxt/uno.config.mjs'],
  ['sveltekit-scoped', 'src/routes/+page.svelte', 'svelte', 'node_modules/@julr/unocss-preset-forms'],
  // vite-pug's UnoCSS lives in `<template lang="pug">` inside a .vue file, so the
  // languageId is `vue` (already supported); its uno.config.ts adds extractorPug.
  ['vite-pug', 'src/App.vue', 'vue'],
  // The server extracts classes from .marko / .elm regardless of languageId.
  // These now resolve because the example ships a standalone uno.config.ts; in
  // Zed itself they additionally need the community Marko / Elm grammar
  // extension installed (see CAVEATS) before Zed attaches the server.
  ['marko-run', 'src/routes/+page.marko', 'marko'],
  ['vite-elm', 'src/Main.elm', 'elm'],
]

// Remaining caveats — the extension now lists these languages, but Zed has no
// built-in grammar for them, so the underline only appears once the user installs
// the matching community language extension. Not a limitation of this extension.
const CAVEATS = [
  ['marko-run', 'Zed needs a community Marko language extension installed'],
  ['vite-elm', 'Zed needs a community Elm language extension installed'],
]

function countTokens(file, languageId, rootDir) {
  return new Promise((res) => {
    const root = pathToFileURL(resolve(repoRoot, rootDir)).href
    const uri = pathToFileURL(resolve(repoRoot, file)).href
    const text = readFileSync(resolve(repoRoot, file), 'utf8')
    const p = spawn('node', [SERVER, '--stdio'], { cwd: repoRoot })
    let buf = Buffer.alloc(0)
    const handlers = {}
    p.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d])
      for (;;) {
        const s = buf.indexOf('\r\n\r\n')
        if (s < 0)
          break
        const len = +(/Content-Length: (\d+)/.exec(buf.slice(0, s).toString())?.[1] ?? 0)
        if (buf.length < s + 4 + len)
          break
        const msg = JSON.parse(buf.slice(s + 4, s + 4 + len).toString())
        buf = buf.slice(s + 4 + len)
        if (msg.id != null && handlers[msg.id])
          handlers[msg.id](msg)
      }
    })
    let id = 0
    const send = (method, params) => {
      const body = JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params })
      p.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
      return new Promise(r => (handlers[id] = r))
    }
    const notify = (method, params) => {
      const body = JSON.stringify({ jsonrpc: '2.0', method, params })
      p.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
    }
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    ;(async () => {
      await send('initialize', { processId: process.pid, rootUri: root, workspaceFolders: [{ uri: root, name: 'demo' }], capabilities: {} })
      notify('initialized', {})
      notify('workspace/didChangeConfiguration', { settings: { unocss: { semanticTokens: true } } })
      await sleep(1500)
      notify('textDocument/didOpen', { textDocument: { uri, languageId, version: 1, text } })
      await sleep(1500)
      const r = await send('textDocument/semanticTokens/full', { textDocument: { uri } })
      p.kill()
      res((r.result?.data?.length ?? 0) / 5)
    })()
  })
}

console.log(`\nUnoCSS Zed extension — semantic-token verification across examples\n${'='.repeat(64)}\n`)
let ok = 0
let skipped = 0
for (const [ex, file, lang, prereq] of WORKS) {
  const rel = `examples/${ex}/${file}`
  if (!existsSync(resolve(repoRoot, rel))) {
    console.log(`  ?  ${ex.padEnd(22)} (missing ${file})`)
    continue
  }
  if (prereq && !existsSync(resolve(repoRoot, `examples/${ex}`, prereq))) {
    console.log(`  ⏭  ${ex.padEnd(22)} run \`pnpm install\` in examples/${ex} first (needs ${prereq})`)
    skipped++
    continue
  }
  const n = await countTokens(rel, lang, `examples/${ex}`)
  console.log(`  ${n > 0 ? '✅' : '❌'} ${ex.padEnd(22)} ${String(n).padStart(3)} tokens  (${lang}: ${file})`)
  if (n > 0)
    ok++
}
console.log(`\n  ${ok}/${WORKS.length - skipped} examples emit tokens${skipped ? ` (${skipped} skipped — deps not installed)` : ''}.\n\nKnown caveats (see DEMO.md):`)
for (const [ex, why] of CAVEATS)
  console.log(`  ⚠️  ${ex.padEnd(22)} ${why}`)
console.log('')

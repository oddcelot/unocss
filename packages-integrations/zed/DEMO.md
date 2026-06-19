# UnoCSS Zed extension — demo

This branch (`demo/zed-extension`) is set up so anyone can check out the repo and
see the extension working against the bundled `examples/`.

There are two ways to try it:

- **Headless (no editor):** run the verification script — boots the real
  language server and reports the `unocss` semantic tokens it emits per example.
- **Interactive (in Zed):** install the dev extension and open example files.

---

## 1. Headless verification (fastest)

```bash
pnpm install
pnpm build                      # builds @unocss/language-server (dist/)
node packages-integrations/zed/scripts/verify-examples.mjs
```

Expected output — **16/16** examples emit tokens:

```
  ✅ astro                    6 tokens  (astro: src/pages/index.astro)
  ✅ astro-vue                3 tokens  (astro: src/pages/index.astro)
  ✅ next                    80 tokens  (typescriptreact: app/page.tsx)
  ✅ remix                    6 tokens  (typescriptreact: app/routes/_index.tsx)
  ✅ nuxt3                    5 tokens  (vue: app.vue)
  ✅ sveltekit                2 tokens  (svelte: src/routes/+page.svelte)
  ✅ sveltekit-preprocess     8 tokens  (svelte: src/routes/+page.svelte)
  ✅ vite-angular            82 tokens  (html: src/app/app.component.html)
  ✅ vite-lightningcss        3 tokens  (html: index.html)
  ✅ vite-lit                31 tokens  (typescript: src/my-element.ts)
  ✅ vite-svelte             21 tokens  (svelte: src/App.svelte)
  ✅ vite-svelte-postcss     28 tokens  (svelte: src/App.svelte)
  ✅ vite-svelte-scoped      18 tokens  (svelte: src/App.svelte)
  ✅ vite-vue3               10 tokens  (vue: src/App.vue)
  ✅ vite-vue3-postcss       26 tokens  (vue: src/App.vue)
  ✅ vite-vue3-scoped         3 tokens  (vue: src/App.vue)
```

A token count > 0 means the server resolved the example's config and matched
utilities in that file — exactly what powers completion, hover, color previews
and the underline in Zed. `vite-lit` proves the Lit case (utilities inside
`` html`...` `` template literals in a plain `.ts` file).

---

## 2. Interactive in Zed

1. Build the server (once): `pnpm build`.
2. In Zed: command palette → **`zed: install dev extension`** → select
   `packages-integrations/zed/`.
3. Open this repo's root folder in Zed. The committed `.zed/settings.json` already:
   - points the extension at the locally-built server (`binary` override),
   - turns on `semanticTokens`,
   - enables `semantic_tokens` for the relevant languages.
4. **For the underline only**, add the styling rule to your **USER** settings
   (`~/.config/zed/settings.json`). The per-language `semantic_tokens` settings
   work in the project file, but `global_lsp_settings` is read only from user
   settings — it is not available in a worktree-local `.zed/settings.json`:
   ```json
   { "global_lsp_settings": { "semantic_token_rules": [{ "token_type": "unocss", "underline": "#888888" }] } }
   ```
5. Open e.g. `examples/vite-vue3/src/App.vue` or `examples/next/app/page.tsx`:
   - hover a utility → CSS preview,
   - type in a `class`/`className` → completion,
   - color utilities show a swatch,
   - matched utilities are underlined.

---

## Caveats (not extension bugs)

The language server resolves UnoCSS config **independently of the bundler**, the
same way it does for the VSCode extension. A few examples therefore need an extra
step or aren't covered:

| Example                                                                        | Why                                                                                                                                                  | To enable                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `nuxt3-layers`                                                                 | config is generated into `.nuxt/`                                                                                                                    | run `nuxt prepare` first                             |
| `sveltekit-scoped`                                                             | config imports `@julr/unocss-preset-forms`                                                                                                           | install that example's deps                          |
| `vite-react`, `vite-preact`, `vite-solid`, `qwik`, `quasar`, `vite-watch-mode` | UnoCSS configured only inside `vite.config.ts` (no standalone `uno.config.ts`), and the bundler plugins it imports aren't installed in the workspace | install the example's deps, or add a `uno.config.ts` |
| `vite-elm`, `vite-pug`, `marko-run`                                            | Elm / Pug / Marko aren't in the extension's language list                                                                                            | n/a                                                  |

The middle row is the key insight: editor support needs a config the standalone
server can load (a `uno.config.ts`, or a `vite.config.ts` whose imports resolve).
When config lives only in an uninstalled bundler plugin, there's nothing for the
server — or VSCode — to read.

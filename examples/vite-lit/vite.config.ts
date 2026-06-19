import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'
import presetTypography from '@unocss/preset-typography'
import presetWind3 from '@unocss/preset-wind3'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import ViteInspector from 'vite-plugin-inspect'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/my-element.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: /^lit/,
    },
  },
  plugins: [
    UnoCSS({
      mode: 'shadow-dom',
      // Lit components keep their markup in `class="..."` inside html`...`
      // tagged template literals in plain .ts files. UnoCSS's default pipeline
      // only scans .vue/.svelte/.[jt]sx/.html, so .ts is opted in here — this is
      // what lets both the build and the language-server (autocomplete/hover)
      // see the classes.
      content: {
        pipeline: {
          include: [
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
            /\.[jt]s($|\?)/,
          ],
        },
      },
      shortcuts: [
        { logo: 'i-logos-webcomponents w-6em h-6em transform transition-800 hover:rotate-180' },
        { 'cool-blue': 'bg-blue-500 text-white' },
        { 'cool-green': 'bg-green-500 text-black' },
      ],
      presets: [
        presetWind3(),
        presetAttributify(),
        presetIcons({
          extraProperties: {
            'display': 'inline-block',
            'vertical-align': 'middle',
          },
        }),
        presetTypography(),
      ],
      inspector: false,
    }),
    ViteInspector(),
  ],
})

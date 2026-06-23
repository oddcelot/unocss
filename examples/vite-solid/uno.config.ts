import presetAttributify from '@unocss/preset-attributify'
import presetIcons from '@unocss/preset-icons'
import presetWind3 from '@unocss/preset-wind3'
import { defineConfig } from 'unocss'

// Mirrors the UnoCSS options in vite.config.ts. The language server resolves
// config independently of the bundler, so this standalone file lets it load
// presetAttributify and light up attributify syntax (e.g. `bg="blue-400"`) in
// the editor. See packages-integrations/zed/DEMO.md.
export default defineConfig({
  shortcuts: [
    { logo: 'i-logos-solidjs-icon w-6em h-6em transform transition-800 hover:rotate-360' },
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
  ],
})

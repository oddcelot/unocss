// Mirrors the UnoCSS plugin config in vite.config.ts so editors (Zed, VS Code)
// can resolve presets without booting the full Vite/Qwik toolchain.
import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'

export default defineConfig({
  shortcuts: [
    { logo: 'i-logos-qwik w-6em h-6em transform transition-800 hover:rotate-180' },
  ],
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
})

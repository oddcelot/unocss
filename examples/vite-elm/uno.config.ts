// Mirrors the UnoCSS plugin config in vite.config.js so editors (Zed, VS Code)
// resolve presets and the logo shortcut without booting the full Vite toolchain.
import presetIcons from '@unocss/preset-icons'
import { presetWind3 } from '@unocss/preset-wind3'
import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: [
    { logo: 'i-logos-elm w-6em h-6em transform transition-800 hover:rotate-360' },
  ],
  presets: [
    presetWind3(),
    presetIcons(),
  ],
})

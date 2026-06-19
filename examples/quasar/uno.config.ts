// Mirrors the UnoCSS plugin config in quasar.config.js so editors (Zed, VS Code)
// can resolve presets without booting the full Quasar toolchain.
import { defineConfig, presetAttributify, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [presetWind4(), presetAttributify()],
})

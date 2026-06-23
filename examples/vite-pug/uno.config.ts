// Mirrors the UnoCSS plugin config in vite.config.ts so editors (Zed, VS Code)
// resolve presetWind3 and the Pug extractor for `<template lang="pug">` blocks
// without booting the full Vite toolchain.
import extractorPug from '@unocss/extractor-pug'
import presetWind3 from '@unocss/preset-wind3'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
  ],
  extractors: [
    extractorPug(),
  ],
})

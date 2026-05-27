// One-shot asset compression. Re-run when source/ images change.
//
//   node scripts/compress-assets.mjs
//
// Reads from src/renderer/src/assets/source/ and writes optimised variants to
// src/renderer/src/assets/.  Source/ is gitignored — keep the originals there
// so we can re-export to higher quality later if needed.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const SRC = 'src/renderer/src/assets/source'
const OUT = 'src/renderer/src/assets'

const tasks = [
  // Scene backgrounds — 1920×1080 WebP, q=80
  { in: 'scene-forest.png', out: 'scene-forest.webp', kind: 'scene' },
  { in: 'scene-sea.png', out: 'scene-sea.webp', kind: 'scene' },
  { in: 'scene-mountain.png', out: 'scene-mountain.webp', kind: 'scene' },
  // Empty-state illustrations — 800×600 WebP, q=85
  { in: 'empty-today.png', out: 'empty-today.webp', kind: 'empty' },
  { in: 'empty-insights.png', out: 'empty-insights.webp', kind: 'empty' },
  { in: 'empty-stats.png', out: 'empty-stats.webp', kind: 'empty' },
  // App icon — keep PNG, generate 3 sizes
  { in: 'icon-app.png', out: 'icon-app-128.png', kind: 'icon', size: 128 },
  { in: 'icon-app.png', out: 'icon-app-64.png', kind: 'icon', size: 64 },
  { in: 'icon-app.png', out: 'icon-app-32.png', kind: 'icon', size: 32 }
]

await mkdir(OUT, { recursive: true })

for (const t of tasks) {
  const srcPath = join(SRC, t.in)
  const outPath = join(OUT, t.out)
  let pipeline = sharp(srcPath)
  if (t.kind === 'scene') {
    pipeline = pipeline.resize(1920, 1080, { fit: 'cover' }).webp({ quality: 80 })
  } else if (t.kind === 'empty') {
    // Empty-state line art has large transparent areas. Lossy WebP — even
    // with alphaQuality:100 — leaves visible gray smudges in the transparent
    // margins (the Gemini-generated PNGs appear to embed faint pixel noise /
    // watermarks). Use lossless + a smaller source (400×300, plenty for the
    // 200×200 display target even at 2× DPI) to keep alpha pixel-perfect
    // without blowing up file size.
    pipeline = pipeline.resize(400, 300, { fit: 'inside' })
      .webp({ lossless: true, effort: 6 })
  } else if (t.kind === 'icon') {
    pipeline = pipeline.resize(t.size, t.size, { fit: 'inside' }).png({ compressionLevel: 9 })
  }
  const info = await pipeline.toFile(outPath)
  console.log(`${t.out.padEnd(28)} ${(info.size / 1024).toFixed(1).padStart(7)} KB  ${info.width}×${info.height}`)
}

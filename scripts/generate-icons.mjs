import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const svgPath = path.join(__dirname, '../build/icon.svg')
const outputDir = path.join(__dirname, '../build')

// Read SVG
const svg = fs.readFileSync(svgPath, 'utf8')

// Generate PNG at 256x256 (required for Windows ico)
const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 256,
  },
})

const pngData = resvg.render()
const pngBuffer = pngData.asPng()

fs.writeFileSync(path.join(outputDir, 'icon.png'), pngBuffer)
console.log('Generated icon.png (256x256)')

// Also generate a 512x512 version
const resvg512 = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 512,
  },
})

const pngData512 = resvg512.render()
const pngBuffer512 = pngData512.asPng()

fs.writeFileSync(path.join(outputDir, 'icon-512.png'), pngBuffer512)
console.log('Generated icon-512.png (512x512)')

console.log('Icons generated successfully!')

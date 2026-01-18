/**
 * Script to generate PWA icons from logo.svg
 * 
 * Requirements:
 * - Install sharp: npm install sharp --save-dev
 * - Run: node generate-icons.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateIcons() {
  try {
    // Check if sharp is available
    let sharp
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      console.error('❌ Error: sharp is not installed.')
      console.log('📦 Please install it first: npm install sharp --save-dev')
      console.log('   Then run: node generate-icons.js')
      process.exit(1)
    }

    const svgPath = path.join(__dirname, 'public', 'logo.svg')
    const iconsDir = path.join(__dirname, 'public', 'icons')
    
    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath)
    
    // Generate 192x192 icon
    await sharp(svgBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42 } // #0f172a background
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-192.png'))
    
    console.log('✅ Generated icon-192.png')

    // Generate 512x512 icon
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42 } // #0f172a background
      })
      .png()
      .toFile(path.join(iconsDir, 'icon-512.png'))
    
    console.log('✅ Generated icon-512.png')
    console.log('🎉 Icons generated successfully!')
  } catch (error) {
    console.error('❌ Error generating icons:', error.message)
    process.exit(1)
  }
}

generateIcons()


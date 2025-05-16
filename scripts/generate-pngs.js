// Script to generate PNG icons from SVG source
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const SVG_PATH = path.join(__dirname, '../extension/assets/images/icon.svg');
const ICONS_DIR = path.join(__dirname, '../extension/icons');

// Icon sizes
const ICON_SIZES = [16, 48, 128];

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Read SVG file
const svgBuffer = fs.readFileSync(SVG_PATH);

// Generate PNG icons for each size
async function generateIcons() {
  console.log('Generating PNG icons from SVG...');
  
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating icon${size}.png:`, error);
    }
  }
  
  console.log('Icon generation complete!');
}

// Run the icon generation
generateIcons().catch(error => {
  console.error('Error generating icons:', error);
  process.exit(1);
});

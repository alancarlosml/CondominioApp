let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error("sharp não instalado (removido p/ build iOS EAS). Rode 'npm i -D sharp' localmente p/ gerar screenshots.");
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'screenshorts');
const outputDir = path.join(__dirname, '..', 'screenshots', 'ios');

const sizes = {
  'iphone-16-pro-max': { width: 2778, height: 1284 },
  'iphone-16-pro': { width: 2622, height: 1206 },
  'iphone-16': { width: 2556, height: 1179 },
  'iphone-15-pro-max': { width: 2778, height: 1284 },
  'iphone-14-pro-max': { width: 2778, height: 1284 },
  'iphone-se': { width: 1334, height: 750 },
};

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const images = ['01.jpg', '02.jpg', '03.jpg', '04.jpg'];

async function processImages() {
  console.log('Gerando screenshots para iOS...\n');

  for (const imageName of images) {
    const inputPath = path.join(inputDir, imageName);
    const outputName = imageName.replace('.jpg', '.png');

    for (const [device, size] of Object.entries(sizes)) {
      const deviceDir = path.join(outputDir, device);
      if (!fs.existsSync(deviceDir)) {
        fs.mkdirSync(deviceDir, { recursive: true });
      }

      const outputPath = path.join(deviceDir, outputName);

      try {
        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'top'
          })
          .toFile(outputPath);

        console.log(`✓ ${device}/${outputName}`);
      } catch (error) {
        console.error(`✗ Erro em ${imageName}:`, error.message);
      }
    }
  }

  console.log('\nPronto! Screenshots gerados em screenshots/ios/');
}

processImages();

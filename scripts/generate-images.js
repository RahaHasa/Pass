const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets/images');
const sizes = {
  'icon.png': 1024,
  'adaptive-icon.png': 1024,
  'splash.png': 2048,
  'notification-icon.png': 96,
  'favicon.png': 32
};

// Создаем директорию assets/images, если она не существует
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Создаем директорию assets/sounds, если она не существует
const soundsDir = path.join(__dirname, '../assets/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Создаем пустой файл notification.wav
fs.writeFileSync(path.join(soundsDir, 'notification.wav'), '');

// Генерируем изображения
Object.entries(sizes).forEach(([filename, size]) => {
  sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 122, b: 255, alpha: 1 }
    }
  })
  .png()
  .toFile(path.join(assetsDir, filename))
  .then(() => {
    console.log(`Created ${filename}`);
  })
  .catch(err => {
    console.error(`Error creating ${filename}:`, err);
  });
}); 
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, '../assets');
const sizes = {
  'icon.png': 1024,
  'adaptive-icon.png': 1024,
  'splash.png': 2048,
  'notification-icon.png': 96,
  'favicon.png': 32
};

// Создаем директорию assets, если она не существует
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Создаем директорию sounds, если она не существует
const soundsDir = path.join(assetsDir, 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Создаем пустой файл notification.wav
fs.writeFileSync(path.join(soundsDir, 'notification.wav'), '');

// Генерируем изображения
Object.entries(sizes).forEach(([filename, size]) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Заполняем фон
  ctx.fillStyle = '#007AFF';
  ctx.fillRect(0, 0, size, size);

  // Добавляем текст
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${size / 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H2', size / 2, size / 2);

  // Сохраняем изображение
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
}); 
const fs = require('fs');

const generateSyntheticData = () => {
  const dataset = [];
  let lat = 55.7558;
  let lon = 37.6173;
  let speed = 50;
  let timestamp = Date.now();

  for (let i = 0; i < 5000; i++) {
    const acceleration = (Math.random() - 0.5) * 4;
    speed = Math.max(0, Math.min(120, speed + acceleration));
    lat += (Math.random() - 0.5) * 0.002;
    lon += (Math.random() - 0.5) * 0.002;
    timestamp += 1000;
    
    const suddenStop = Math.random() < 0.02 ? 0 : speed;
    const sharpTurn = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.01 : 0;
    const deviation = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.02 : 0;

    lat += deviation;
    lon += sharpTurn;
    speed = suddenStop;
    
    const isAnomalous = speed > 120 || acceleration > 3 || suddenStop === 0 || Math.abs(sharpTurn) > 0.005 || Math.abs(deviation) > 0.01;
    dataset.push({ 
      latitude: lat.toFixed(6), 
      longitude: lon.toFixed(6), 
      speed: speed.toFixed(2), 
      acceleration: acceleration.toFixed(2), 
      timestamp, 
      anomaly: isAnomalous 
    });
  }

  const csvHeader = 'latitude,longitude,speed,acceleration,timestamp,anomaly\n';
  
  const csvRows = dataset.map(row => 
    `${row.latitude},${row.longitude},${row.speed},${row.acceleration},${row.timestamp},${row.anomaly}`
  ).join('\n');
  
  fs.writeFileSync('dataset.csv', csvHeader + csvRows);
  
  console.log('Dataset saved as dataset.csv');
  console.log(`Generated ${dataset.length} records`);
};

generateSyntheticData();

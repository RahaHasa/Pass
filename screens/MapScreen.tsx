import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const API_KEY = '45ab39ff-e1f7-4242-b309-60ea46ed148d';

interface GPSPoint {
  lat: number;
  lon: number;
  timestamp: number;
  speed?: number;
}

const MapScreen = () => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const [gpsData, setGpsData] = useState<GPSPoint[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const webViewRef = useRef<WebView>(null);

  const analyzeGPSData = (points: GPSPoint[]) => {
    if (points.length < 2) return points;
    
    const analyzedData = [...points];
    
    for (let i = 1; i < analyzedData.length; i++) {
      const point1 = { 
        latitude: analyzedData[i - 1].lat, 
        longitude: analyzedData[i - 1].lon 
      };
      const point2 = { 
        latitude: analyzedData[i].lat, 
        longitude: analyzedData[i].lon 
      };
      
      const distanceM = getDistance(point1, point2);
      const timeDiffS = (analyzedData[i].timestamp - analyzedData[i - 1].timestamp) / 1000;
      
      if (timeDiffS > 0) {
        const speedKmh = (distanceM / timeDiffS) * 3.6;
        analyzedData[i].speed = speedKmh;
        
        const prevSpeed = analyzedData[i - 1].speed;
        if (prevSpeed !== undefined) {
          const acceleration = (speedKmh - prevSpeed) / timeDiffS;
          
          // Обнаружение аномалий
          if (Math.abs(acceleration) > 3) {
            console.log(`⚠ Аномалия: резкое ускорение/торможение (${acceleration.toFixed(2)} м/с²) на точке`, point2);
          }

          // Обнаружение резких поворотов
          if (i > 1) {
            const prevVector = {
              x: analyzedData[i - 1].lat - analyzedData[i - 2].lat,
              y: analyzedData[i - 1].lon - analyzedData[i - 2].lon
            };
            const currentVector = {
              x: analyzedData[i].lat - analyzedData[i - 1].lat,
              y: analyzedData[i].lon - analyzedData[i - 1].lon
            };
            
            const dotProduct = prevVector.x * currentVector.x + prevVector.y * currentVector.y;
            const magnitude1 = Math.sqrt(prevVector.x ** 2 + prevVector.y ** 2);
            const magnitude2 = Math.sqrt(currentVector.x ** 2 + currentVector.y ** 2);
            
            if (magnitude1 > 0 && magnitude2 > 0) {
              const cosTheta = dotProduct / (magnitude1 * magnitude2);
              const angle = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI);
              
              if (angle > 30) {
                console.log(`⚠ Аномалия: резкий поворот (${angle.toFixed(2)}°) на точке`, point2);
              }
            }
          }

          console.log(`Скорость: ${speedKmh.toFixed(2)} км/ч, Ускорение: ${acceleration.toFixed(2)} м/с²`);
        }
      }
    }

    return analyzedData;
  };

  const startLocationUpdates = async () => {
    try {
      console.log("Starting location updates...");
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Обновление каждую секунду
          distanceInterval: 1, // Обновление при движении на 1 метр
        },
        (location) => {
          console.log("New location received:", location);
          if (location && location.coords) {
            const coordinates: [number, number] = [location.coords.longitude, location.coords.latitude];
            setUserLocation(coordinates);

            const newPoint: GPSPoint = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              timestamp: Date.now()
            };

            setGpsData(prevData => {
              const updatedData = [...prevData, newPoint];
              return analyzeGPSData(updatedData);
            });
          }
        }
      );
      console.log("Location updates started successfully");
    } catch (error) {
      console.error("Error starting location updates:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      console.log("Requesting location permission...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== 'granted') {
        console.log("Permission not granted");
        Alert.alert(
          'Требуется разрешение',
          'Для работы с картой необходимо разрешение на использование местоположения',
          [{ text: 'OK' }]
        );
        return false;
      }
      console.log("Permission granted");
      setLocationPermission(true);

      // Запускаем постоянное отслеживание местоположения
      await startLocationUpdates();
      return true;
    } catch (error) {
      console.error('Ошибка при получении местоположения:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось получить ваше местоположение. Пожалуйста, проверьте настройки геолокации и попробуйте снова.',
        [
          { 
            text: 'Отмена',
            style: 'cancel'
          },
          {
            text: 'Повторить',
            onPress: () => requestLocationPermission()
          }
        ]
      );
      return false;
    }
  };

  useEffect(() => {
    const initializeLocation = async () => {
      console.log("Initializing location...");
      const hasPermission = await requestLocationPermission();
      console.log("Initial location permission result:", hasPermission);
    };
    
    initializeLocation();

    // Очистка при размонтировании компонента
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (webViewReady && userLocation) {
      console.log("Sending initial location to WebView:", userLocation);
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: ${JSON.stringify({
              type: 'location',
              coordinates: userLocation
            })}
          }));
        `);
      }, 100);
    }
  }, [webViewReady, userLocation]);

  // Обновляем местоположение на карте при изменении GPS-данных
  useEffect(() => {
    if (gpsData.length > 0) {
      const lastPoint = gpsData[gpsData.length - 1];
      const coordinates: [number, number] = [lastPoint.lon, lastPoint.lat];
      setUserLocation(coordinates);

      // Отправляем обновленное местоположение в WebView
      if (webViewReady) {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: ${JSON.stringify({
              type: 'location',
              coordinates: coordinates
            })}
          }));
        `);
      }
    }
  }, [gpsData, webViewReady]);

  const handleMessage = async (event: any) => {
    try {
      console.log("Received message from WebView:", event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapError') {
        console.error("Map error:", data.error);
        setMapError(data.error);
        return;
      }

      if (data.type === 'requestLocation') {
        console.log("Location requested by WebView");
        const hasPermission = await requestLocationPermission();
        console.log("Location permission result:", hasPermission);
        
        if (hasPermission && userLocation) {
          console.log("Sending location to WebView:", userLocation);
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new MessageEvent('message', {
                data: ${JSON.stringify({
                  type: 'location',
                  coordinates: userLocation,
                  address: data.address
                })}
              }));
            `);
          }, 100);
        } else {
          console.log("No location available");
          Alert.alert(
            'Ошибка',
            'Не удалось получить местоположение. Пожалуйста, проверьте настройки геолокации.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>2GIS Map</title>
        <style>
            body, html {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            #container {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }
            #controls {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                z-index: 1000;
                background: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            #address {
                width: 100%;
                height: 40px;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 0 10px;
                margin-bottom: 10px;
                font-size: 16px;
            }
            #suggestions {
                position: absolute;
                background: white;
                border: 1px solid #ccc;
                max-height: 200px;
                overflow-y: auto;
                width: calc(100% - 30px);
                z-index: 1000;
                border-radius: 5px;
                margin-top: 5px;
            }
            .suggestion {
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            .suggestion:hover {
                background: #f0f0f0;
            }
            #route-btn {
                width: 100%;
                height: 40px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                margin-top: 10px;
                cursor: pointer;
            }
            #route-btn:hover {
                background: #0056b3;
            }
            #status, #travel-time {
                margin-top: 10px;
                font-size: 16px;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div id="container">
            <div id="controls">
                <input type="text" id="address" placeholder="Введите адрес">
                <div id="suggestions"></div>
                <button id="route-btn">Построить маршрут</button>
                <p id="status"></p>
                <p id="travel-time">Время в пути: -</p>
            </div>
        </div>
        <script src="https://mapgl.2gis.com/api/js/v1"></script>
        <script src="https://unpkg.com/@2gis/mapgl-directions@^2/dist/directions.js"></script>
        <script>
        const API_KEY = '${API_KEY}';
        let map = null;
        let directions = null;
        let userLocation = null;
        let locationMarker = null;

        function initializeMap() {
            console.log("Initializing map...");
            try {
                map = new mapgl.Map('container', {
                    key: API_KEY,
                    center: [76.894130, 43.242781],
                    zoom: 13,
                });
                console.log("Map initialized successfully");

                directions = new mapgl.Directions(map, {
                    directionsApiKey: API_KEY
                });
                console.log("Directions initialized successfully");

                // Добавляем обработчик загрузки карты
                map.on('load', () => {
                    console.log("Map loaded successfully");
                    // Отправляем сообщение о готовности карты
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapReady'
                    }));
                });
            } catch (error) {
                console.error("Error initializing map:", error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapError',
                    error: error.message
                }));
            }
        }

        function setUserLocation(coords) {
            if (!coords) {
                console.log("No coordinates provided");
                return;
            }
            
            if (!map) {
                console.log("Map not initialized");
                return;
            }
            
            console.log("Setting user location:", coords);
            userLocation = coords;
            
            if (locationMarker) {
                locationMarker.destroy();
            }
            
            try {
                locationMarker = new mapgl.Marker(map, {
                    coordinates: userLocation,
                    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBmaWxsPSIjMDA3QUZGIi8+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4='
                });
                
                map.setCenter(userLocation);
                map.setZoom(15);
                console.log("Location marker set successfully");
            } catch (error) {
                console.error("Error setting location marker:", error);
            }
        }

        window.addEventListener('message', function(event) {
            console.log("Received message from React Native:", event.data);
            try {
                const data = event.data;
                if (data.type === 'location') {
                    console.log("Processing location data:", data);
                    setUserLocation(data.coordinates);
                    if (data.address) {
                        console.log("Building route for address:", data.address);
                        getCoordinatesByAddress(data.address, (destination) => {
                            if (destination) {
                                buildRouteFromPoints(data.coordinates, destination);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        });

        // Инициализируем карту после загрузки всех скриптов
        window.addEventListener('load', initializeMap);

        function getSuggestions(query) {
            if (query.length < 3) return;
            const url = \`https://catalog.api.2gis.com/3.0/suggests?q=\${encodeURIComponent(query)}&types=building,branch,street&key=\${API_KEY}\`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (!data.result || !data.result.items) {
                        console.error("API вернул неожиданный ответ:", data);
                        return;
                    }
                    const suggestionsBox = document.getElementById("suggestions");
                    suggestionsBox.innerHTML = "";
                    data.result.items.forEach(item => {
                        const div = document.createElement("div");
                        div.textContent = item.full_name;
                        div.classList.add("suggestion");
                        div.addEventListener("click", () => {
                            document.getElementById("address").value = item.full_name;
                            suggestionsBox.innerHTML = "";
                            getCoordinatesByAddress(item.full_name, (destination) => {
                                if (userLocation) {
                                    buildRouteFromPoints(userLocation, destination);
                                }
                            });
                        });
                        suggestionsBox.appendChild(div);
                    });
                })
                .catch(error => console.error("Ошибка получения подсказок:", error));
        }

        function getCoordinatesByAddress(address, callback) {
            const url = \`https://catalog.api.2gis.com/3.0/items?q=\${encodeURIComponent(address)}&fields=items.point,items.address&key=\${API_KEY}\`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.result.items.length > 0) {
                        const point = data.result.items[0].point;
                        callback([point.lon, point.lat]);
                    } else {
                        alert("Адрес не найден!");
                    }
                })
                .catch(error => console.error("Ошибка геокодинга:", error));
        }

        function getTravelTime(source, destination) {
            const url = \`https://routing.api.2gis.com/get_dist_matrix?key=\${API_KEY}&version=2.0\`;
            const requestBody = {
                points: [
                    { lat: source[1], lon: source[0] },
                    { lat: destination[1], lon: destination[0] }
                ],
                sources: [0],
                targets: [1]
            };
            
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const duration = data.routes[0].duration;
                    document.getElementById("travel-time").textContent = \`Время в пути: \${(duration / 60).toFixed(2)} мин.\`;
                } else {
                    document.getElementById("travel-time").textContent = "Время в пути: недоступно";
                }
            })
            .catch(error => console.error("Ошибка получения времени в пути:", error));
        }

        function buildRouteFromPoints(source, destination) {
            console.log("Building route from:", source, "to:", destination);
            directions.clear();
            directions.carRoute({ points: [source, destination] })
                .then(() => {
                    getTravelTime(source, destination);
                })
                .catch(error => console.error("Ошибка построения маршрута:", error));
            map.setCenter(destination);
            map.setZoom(14);
        }

        function buildRoute() {
            const address = document.getElementById("address").value;
            if (!address) {
                alert("Введите адрес!");
                return;
            }
            if (!userLocation) {
                console.log("Requesting location for address:", address);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'requestLocation',
                    address: address
                }));
                return;
            }
            console.log("Building route with location:", userLocation);
            getCoordinatesByAddress(address, (destination) => {
                if (destination) {
                    console.log("Got destination:", destination);
                    buildRouteFromPoints(userLocation, destination);
                }
            });
        }

        document.getElementById("address").addEventListener("input", (e) => {
            getSuggestions(e.target.value);
        });

        document.getElementById("route-btn").addEventListener("click", buildRoute);
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setMapError('Ошибка загрузки карты');
        }}
        onLoadEnd={() => {
          console.log("WebView loaded");
          setMapError(null);
          setWebViewReady(true);
        }}
        onMessage={handleMessage}
        androidLayerType="hardware"
      />

      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      )}

      {gpsData.length > 0 && (
        <View style={styles.gpsInfo}>
          <Text style={styles.gpsText}>
            Последняя скорость: {gpsData[gpsData.length - 1].speed?.toFixed(2)} км/ч
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  errorOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  gpsInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  gpsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default MapScreen; 
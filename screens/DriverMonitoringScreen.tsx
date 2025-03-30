import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
    speed: number | null;
  };
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

const DriverMonitoringScreen = () => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [safetyScore, setSafetyScore] = useState(10);
  const [speed, setSpeed] = useState(0);
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [apiError, setApiError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testData, setTestData] = useState({
    latitude: 43.242781,
    longitude: 76.894130,
    speed: 0,
    acceleration: 0,
    timestamp: new Date().toISOString()
  });
  const [isTestMode, setIsTestMode] = useState(false);
  const [testRoute, setTestRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  useEffect(() => {
    setupLocationTracking();
    setupAccelerometer();
    setupNotifications();
  }, []);

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходим доступ к местоположению');
        return;
      }

      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 2000; // Минимальный интервал между обновлениями в миллисекундах

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Увеличиваем интервал обновления
          distanceInterval: 10, // Минимальное расстояние в метрах для обновления
        },
        (newLocation) => {
          const currentTime = Date.now();
          if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
            return; // Пропускаем обновление, если прошло слишком мало времени
          }
          lastUpdateTime = currentTime;

          setLocation(newLocation as LocationState);
          if (newLocation.coords.speed !== null) {
            setSpeed(newLocation.coords.speed * 3.6);
          }
          setRouteCoordinates(prev => [...prev, {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          }]);

          // Отправляем обновленное местоположение в WebView
          if (webViewRef.current) {
            const locationData = {
              type: 'location',
              coords: {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
              }
            };
            webViewRef.current.injectJavaScript(`
              window.dispatchEvent(new MessageEvent('message', {
                data: ${JSON.stringify(locationData)}
              }));
            `);
          }

          if (newLocation.coords.speed !== null && newLocation.coords.speed * 3.6 > 90) {
            sendWarning('Превышение скорости!');
          }
        }
      );
    } catch (error) {
      console.error('Ошибка отслеживания местоположения:', error);
    }
  };

  const setupAccelerometer = () => {
    Accelerometer.setUpdateInterval(1000);
    Accelerometer.addListener(data => {
      setAcceleration(data);
      
      const accelerationMagnitude = Math.sqrt(
        data.x * data.x + data.y * data.y + data.z * data.z
      );
      
      if (accelerationMagnitude > 2) {
        sendWarning('Резкое ускорение/торможение!');
      }
    });
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходим доступ к уведомлениям');
      return;
    }
  };

  const sendWarning = async (message: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Анализ поведения водителя',
        body: message,
        data: { type: 'driver_analysis' },
      },
      trigger: null,
    });
    
    setSafetyScore(prev => Math.max(1, prev - 1));
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', event.nativeEvent.data);
      
      if (data.type === 'mapError') {
        setApiError(data.error);
      } else if (data.type === 'location') {
        // Отправляем местоположение обратно в WebView
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(data)}
            }));
          `);
        }
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  };

  const handleTestSubmit = async () => {
    try {
      console.log('Начало анализа данных...');
      
      // Преобразуем введенные данные в формат для модели
      const inputData = [
        parseFloat(testData.latitude.toString()),
        parseFloat(testData.longitude.toString()),
        parseFloat(testData.speed.toString()),
        parseFloat(testData.acceleration.toString())
      ];
      
      console.log('Подготовленные данные для отправки:', JSON.stringify(inputData, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Превышено время ожидания ответа от сервера');
        controller.abort();
      }, 30000);
      
      console.log('Отправка запроса на сервер...');
      
      const response = await fetch('http://192.168.217.205:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          data: inputData
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Получен ответ от сервера:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Результат анализа:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.is_anomaly) {
        await sendWarning(
          `Обнаружено аномальное поведение водителя!\n` +
          `Оценка аномальности: ${result.anomaly_score}/10\n` +
          `Скорость: ${testData.speed} км/ч\n` +
          `Ускорение: ${testData.acceleration} м/с²`
        );
      } else {
        await sendWarning(
          `Поведение водителя соответствует норме\n` +
          `Оценка аномальности: ${result.anomaly_score}/10\n` +
          `Скорость: ${testData.speed} км/ч\n` +
          `Ускорение: ${testData.acceleration} м/с²`
        );
      }
      
    } catch (error: any) {
      console.error('Ошибка анализа:', error);
      let errorMessage = 'Не удалось проанализировать данные. ';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Превышено время ожидания ответа от сервера (30 секунд).\n\nПожалуйста, проверьте:\n1. Подключение к WiFi\n2. Запущен ли сервер\n3. Доступен ли сервер по адресу 192.168.217.205:5000\n4. Правильно ли настроен файрвол';
      } else if (error.message.includes('Network request failed')) {
        errorMessage += 'Ошибка сети.\n\nПроверьте:\n1. Подключение к WiFi\n2. Запущен ли сервер\n3. Правильный ли IP-адрес сервера\n4. Доступен ли порт 5000';
      } else {
        errorMessage += `\nОшибка: ${error.message || 'Неизвестная ошибка'}\n\nПроверьте:\n1. Все ли поля заполнены корректно\n2. Запущен ли сервер\n3. Правильный ли формат данных\n4. Наличие файла anomaly_detector.pkl на сервере`;
      }
      
      Alert.alert('Ошибка', errorMessage);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2GIS Map</title>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            #container {
                width: 100%;
                height: 100%;
            }
            #error-message {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.9);
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                color: red;
                z-index: 1000;
                display: none;
            }
            #debug-info {
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                display: none;
            }
        </style>
    </head>
    <body>
        <div id="container"></div>
        <div id="error-message"></div>
        <div id="debug-info"></div>
        <script src="https://mapgl.2gis.com/api/js/v1"></script>
        <script>
            const API_KEY = '6fb93e6d-a911-4fa7-9236-8480acbbfab4';
            let map = null;
            let userLocation = null;
            let userMarker = null;

            function showDebug(message) {
                const debugDiv = document.getElementById('debug-info');
                debugDiv.textContent = message;
                debugDiv.style.display = 'block';
                console.log('Debug:', message);
            }

            function showError(message) {
                const errorDiv = document.getElementById('error-message');
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                console.error('Error:', message);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapError',
                    error: message
                }));
            }

            function updateMarker(coords) {
                if (userMarker) {
                    userMarker.setCoordinates(coords);
                } else {
                    userMarker = new window.mapgl.Marker(map, {
                        coordinates: coords,
                        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBmaWxsPSIjMDA3QUZGIi8+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4='
                    });
                }
            }

            function initMap() {
                try {
                    showDebug('Начало инициализации карты...');
                    
                    if (!window.mapgl) {
                        showError('API 2GIS не загружен');
                        return;
                    }

                    map = new window.mapgl.Map('container', {
                        key: API_KEY,
                        center: [76.894130, 43.242781],
                        zoom: 13,
                        trafficControl: 'centerRight',
                        zoomControl: 'centerRight'
                    });

                    // Запрашиваем местоположение у React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'requestLocation'
                    }));

                    map.on('load', () => {
                        showDebug('Карта загружена успешно');
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'mapLoaded',
                            status: 'success'
                        }));
                    });

                    map.on('error', (error) => {
                        showError('Ошибка карты: ' + error.message);
                    });

                } catch (error) {
                    showError('Ошибка инициализации карты: ' + error.message);
                }
            }

            // Слушаем сообщения от React Native
            window.addEventListener('message', function(event) {
                try {
                    const data = event.data;
                    showDebug('Получено сообщение: ' + JSON.stringify(data));
                    
                    if (data.type === 'location') {
                        userLocation = [data.coords.longitude, data.coords.latitude];
                        showDebug('Получено местоположение: ' + JSON.stringify(userLocation));
                        
                        if (map) {
                            map.setCenter(userLocation);
                            map.setZoom(15);
                            updateMarker(userLocation);
                        }
                    }
                } catch (error) {
                    showError('Ошибка обработки сообщения: ' + error.message);
                }
            });

            // Инициализируем карту после загрузки страницы
            if (document.readyState === 'complete') {
                setTimeout(initMap, 1000);
            } else {
                window.addEventListener('load', () => {
                    setTimeout(initMap, 1000);
                });
            }
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
          setApiError('Ошибка загрузки карты: ' + nativeEvent.description);
        }}
        onLoadEnd={() => {
          console.log("WebView loaded");
        }}
        onMessage={handleMessage}
        androidLayerType="hardware"
        originWhitelist={['*']}
        mixedContentMode="always"
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        onLoadProgress={() => {
          console.log("WebView loading progress...");
        }}
        startInLoadingState={false}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowsLinkPreview={true}
      />

      {apiError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Скорость: {speed.toFixed(1)} км/ч</Text>
        <Text style={styles.infoText}>
          Ускорение: {Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y + acceleration.z * acceleration.z).toFixed(2)} м/с²
        </Text>
        <Text style={styles.infoText}>Рейтинг безопасности: {safetyScore}/10</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => setShowTestModal(true)}
        >
          <Text style={styles.testButtonText}>Тест</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTestModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Тестовые параметры</Text>
            
            <ScrollView style={styles.scrollView}>
              <Text style={styles.parameterLabel}>Широта (latitude)</Text>
              <Text style={styles.parameterDescription}>Координата по широте</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите широту"
                keyboardType="numeric"
                value={testData.latitude.toString()}
                onChangeText={(text) => setTestData({...testData, latitude: parseFloat(text) || 0})}
              />

              <Text style={styles.parameterLabel}>Долгота (longitude)</Text>
              <Text style={styles.parameterDescription}>Координата по долготе</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите долготу"
                keyboardType="numeric"
                value={testData.longitude.toString()}
                onChangeText={(text) => setTestData({...testData, longitude: parseFloat(text) || 0})}
              />

              <Text style={styles.parameterLabel}>Скорость (speed)</Text>
              <Text style={styles.parameterDescription}>Скорость движения в км/ч</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите скорость"
                keyboardType="numeric"
                value={testData.speed.toString()}
                onChangeText={(text) => setTestData({...testData, speed: parseFloat(text) || 0})}
              />

              <Text style={styles.parameterLabel}>Ускорение (acceleration)</Text>
              <Text style={styles.parameterDescription}>Ускорение в м/с²</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите ускорение"
                keyboardType="numeric"
                value={testData.acceleration.toString()}
                onChangeText={(text) => setTestData({...testData, acceleration: parseFloat(text) || 0})}
              />

              <Text style={styles.parameterLabel}>Время (timestamp)</Text>
              <Text style={styles.parameterDescription}>Временная метка</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите timestamp"
                value={testData.timestamp}
                onChangeText={(text) => setTestData({...testData, timestamp: text})}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTestModal(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleTestSubmit}
              >
                <Text style={styles.modalButtonText}>Анализировать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  scrollView: {
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  submitButton: {
    backgroundColor: '#34C759',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  parameterDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
});

export default DriverMonitoringScreen; 
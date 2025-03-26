import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
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

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation as LocationState);
          if (newLocation.coords.speed !== null) {
            setSpeed(newLocation.coords.speed * 3.6); // Конвертация в км/ч
          }
          setRouteCoordinates(prev => [...prev, {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          }]);

          // Проверка скорости
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
      
      // Проверка резких ускорений/торможений
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
        title: 'Предупреждение!',
        body: message,
      },
      trigger: null,
    });
    
    // Уменьшаем рейтинг безопасности
    setSafetyScore(prev => Math.max(1, prev - 1));
  };

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#000"
          strokeWidth={3}
        />
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Текущее местоположение"
        />
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Скорость: {speed.toFixed(1)} км/ч</Text>
        <Text style={styles.infoText}>
          Ускорение: {Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y + acceleration.z * acceleration.z).toFixed(2)} м/с²
        </Text>
        <Text style={styles.infoText}>Рейтинг безопасности: {safetyScore}/10</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
});

export default DriverMonitoringScreen; 
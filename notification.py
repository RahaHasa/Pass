import requests
import json
import pickle
import numpy as np
from datetime import datetime

def send_anomaly_notification(user_id, anomaly_data):
    """
    Отправляет уведомление об аномалии на сервер
    """
    try:
        notification_data = {
            'user_id': user_id,
            'type': 'anomaly',
            'title': 'Обнаружена аномалия в поведении водителя',
            'message': f'Скорость: {anomaly_data["speed"]} км/ч, Ускорение: {anomaly_data["acceleration"]} м/с²',
            'timestamp': datetime.now().isoformat(),
            'data': anomaly_data
        }
        
        response = requests.post(
            'http://192.168.217.205:5000/notifications',
            json=notification_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"Ошибка отправки уведомления: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при отправке уведомления: {str(e)}")

def analyze_driver_behavior(data):
    """
    Анализирует поведение водителя с помощью модели аномалий
    """
    try:
        # Загружаем модель
        with open('anomaly_detector.pkl', 'rb') as f:
            model = pickle.load(f)
        
        # Подготавливаем данные для модели
        features = np.array([
            data['speed'],
            data['acceleration'],
            data['braking'],
            data['cornering'],
            data['lane_changes']
        ]).reshape(1, -1)
        
        # Получаем предсказание
        prediction = model.predict(features)
        anomaly_score = model.score_samples(features)[0]
        
        # Если обнаружена аномалия, отправляем уведомление
        if prediction[0] == -1:
            anomaly_data = {
                'speed': data['speed'],
                'acceleration': data['acceleration'],
                'braking': data['braking'],
                'cornering': data['cornering'],
                'lane_changes': data['lane_changes'],
                'anomaly_score': float(anomaly_score),
                'timestamp': datetime.now().isoformat()
            }
            send_anomaly_notification('user123', anomaly_data)  # Замените на реальный ID пользователя
            
        return {
            'is_anomaly': bool(prediction[0] == -1),
            'anomaly_score': float(anomaly_score)
        }
        
    except Exception as e:
        print(f"Ошибка при анализе поведения водителя: {str(e)}")
        return {
            'is_anomaly': False,
            'anomaly_score': 0.0,
            'error': str(e)
        } 
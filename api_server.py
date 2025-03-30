from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# Глобальные переменные для хранения уведомлений
notifications = []
NOTIFICATIONS_FILE = 'notifications.json'

def load_notifications():
    global notifications
    if os.path.exists(NOTIFICATIONS_FILE):
        try:
            with open(NOTIFICATIONS_FILE, 'r', encoding='utf-8') as f:
                notifications = json.load(f)
        except Exception as e:
            print(f"Ошибка загрузки уведомлений: {e}")
            notifications = []

def save_notifications():
    try:
        with open(NOTIFICATIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(notifications, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Ошибка сохранения уведомлений: {e}")

# Загружаем уведомления при запуске
load_notifications()

# Создаем и обучаем модель
print("Создание модели...")
model = IsolationForest(contamination=0.1, random_state=42)

# Загружаем данные для обучения
print("Загрузка данных для обучения...")
try:
    data = pd.read_csv('dataset.csv')
    print(f"Загружено {len(data)} записей")
    
    # Подготавливаем данные для обучения
    X = data[['latitude', 'longitude', 'speed', 'acceleration']].values
    print("Данные подготовлены для обучения")
    
    # Обучаем модель
    print("Начало обучения модели...")
    model.fit(X)
    print("Модель успешно обучена")
    
except Exception as e:
    print(f"Ошибка при загрузке данных: {e}")
    print("Создаем пустую модель")
    model = IsolationForest(contamination=0.1, random_state=42)

print(f"Тип модели: {type(model)}")

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'Сервер работает',
        'endpoints': [
            {'path': '/', 'method': 'GET', 'description': 'Информация о сервере'},
            {'path': '/analyze', 'method': 'POST', 'description': 'Анализ данных'},
            {'path': '/notifications', 'method': 'GET', 'description': 'Получение уведомлений'},
            {'path': '/notifications/<id>/read', 'method': 'POST', 'description': 'Отметить уведомление как прочитанное'}
        ]
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        print(f"Получены данные: {data}")
        
        if not data or 'data' not in data:
            return jsonify({'error': 'Данные не предоставлены'}), 400
            
        # Преобразуем данные в массив numpy
        input_data = np.array(data['data'])
        print(f"Подготовленные данные для анализа: {input_data}")
        
        # Проверяем размерность данных
        if len(input_data) != 4:
            return jsonify({'error': 'Неверный формат данных. Ожидается массив из 4 значений'}), 400
            
        # Преобразуем в двумерный массив для модели
        input_data_2d = input_data.reshape(1, -1)
        
        # Получаем предсказание
        prediction = model.predict(input_data_2d)
        anomaly_score = model.score_samples(input_data_2d)
        
        # Преобразуем оценку аномальности в диапазон от 1 до 10
        # score_samples возвращает отрицательные значения для аномалий
        # Чем больше отрицательное значение, тем сильнее аномалия
        normalized_score = abs(anomaly_score[0])
        anomaly_rating = min(10, max(1, int(normalized_score * 5)))
        
        print(f"Результат анализа: prediction={prediction}, score={anomaly_score}, rating={anomaly_rating}")
        
        # Создаем уведомление
        notification = {
            'id': str(len(notifications) + 1),
            'type': 'anomaly',
            'title': 'Результат анализа поведения водителя',
            'message': f"Статус: {'Аномалия обнаружена' if prediction[0] == -1 else 'Нормальное поведение'}\n"
                      f"Оценка аномальности: {anomaly_rating}/10\n"
                      f"Скорость: {input_data[2]:.1f} км/ч\n"
                      f"Ускорение: {input_data[3]:.2f} м/с²",
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        
        # Добавляем уведомление в список
        notifications.append(notification)
        save_notifications()
        
        return jsonify({
            'status': 'success',
            'anomaly': bool(prediction[0] == -1),
            'anomaly_score': anomaly_rating,
            'notification': notification
        })
        
    except Exception as e:
        print(f"Ошибка при анализе: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notifications', methods=['GET'])
def get_notifications():
    try:
        return jsonify(notifications)
    except Exception as e:
        print(f"Ошибка при получении уведомлений: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/<notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    try:
        for notification in notifications:
            if notification['id'] == notification_id:
                notification['read'] = True
                save_notifications()
                return jsonify({'status': 'success'})
        return jsonify({'error': 'Уведомление не найдено'}), 404
    except Exception as e:
        print(f"Ошибка при отметке уведомления: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Сервер запущен на http://192.168.217.205:5000")
    print("Для доступа с других устройств используйте этот IP-адрес")
    print("Доступные эндпоинты:")
    print("- GET / - информация о сервере")
    print("- POST /analyze - анализ данных")
    print("- GET /notifications - получение уведомлений")
    print("- POST /notifications/<id>/read - отметить уведомление как прочитанное")
    app.run(host='0.0.0.0', debug=True) 
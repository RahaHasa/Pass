import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# 1. Загружаем датасет
df = pd.read_csv("dataset.csv")

# 2. Разделяем данные
X = df[["latitude", "longitude", "speed", "acceleration"]]
y = df["anomaly"]

# 3. Разделяем на тренировочную и тестовую выборки
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Обучаем модель
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Проверяем точность
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Точность модели: {accuracy * 100:.2f}%")

# 6. Сохраняем модель
joblib.dump(model, "anomaly_detector.pkl")
print("Модель сохранена в anomaly_detector.pkl")
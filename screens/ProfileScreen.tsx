import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  name: string;
  surname: string;
  role: string;
  avatar: string;
}

interface SupportTicket {
  id: string;
  date: string;
  status: 'open' | 'closed';
  subject: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface HelpItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface RideHistory {
  id: string;
  date: string;
  from: string;
  to: string;
  price: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled';
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'cash';
  lastFourDigits?: string;
  isDefault: boolean;
  cardHolder?: string;
  expiryDate?: string;
}

interface PromoCode {
  code: string;
  discount: number;
  validUntil: string;
  isUsed: boolean;
}

const ROLES = ['Пассажир', 'Водитель'];

const HelpSection = () => {
  const handleEmailPress = (subject: string) => {
    const mailtoUrl = `mailto:gorislavecz86@mail.ru?subject=${encodeURIComponent(subject)}`;
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Ошибка',
          'Не удалось открыть почтовый клиент. Пожалуйста, проверьте настройки вашего устройства.'
        );
      }
    });
  };

  const helpItems: HelpItem[] = [
    {
      title: 'Как использовать приложение',
      description: 'Пошаговая инструкция по использованию основных функций приложения',
      icon: 'help-circle-outline',
      onPress: () => {
        Alert.alert(
          'Как использовать приложение',
          '1. Введите адрес назначения\n2. Нажмите "Построить маршрут"\n3. Следуйте инструкциям на карте\n4. При необходимости свяжитесь с водителем',
          [{ text: 'OK', style: 'default' }]
        );
      }
    },
    {
      title: 'Часто задаваемые вопросы',
      description: 'Ответы на популярные вопросы пользователей',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => {
        Alert.alert(
          'Часто задаваемые вопросы',
          '1. Как заказать такси?\n2. Как оплатить поездку?\n3. Как отменить заказ?\n4. Как связаться с водителем?',
          [{ text: 'OK', style: 'default' }]
        );
      }
    },
    {
      title: 'Связаться с поддержкой',
      description: 'Получить помощь от службы поддержки',
      icon: 'headset-outline',
      onPress: () => {
        Alert.alert(
          'Связаться с поддержкой',
          'Выберите способ связи:',
          [
            {
              text: 'Написать на email',
              onPress: () => handleEmailPress('Обращение в службу поддержки')
            },
            {
              text: 'Отмена',
              style: 'cancel'
            }
          ]
        );
      }
    },
    {
      title: 'Политика конфиденциальности',
      description: 'Информация о защите ваших данных',
      icon: 'shield-checkmark-outline',
      onPress: () => {
        Alert.alert(
          'Политика конфиденциальности',
          'Мы заботимся о защите ваших персональных данных. Все данные шифруются и хранятся в соответствии с законодательством.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    },
    {
      title: 'Условия использования',
      description: 'Правила использования приложения',
      icon: 'document-text-outline',
      onPress: () => {
        Alert.alert(
          'Условия использования',
          '1. Приложение предназначено для заказа такси\n2. Минимальная стоимость поездки: 1000₸\n3. Оплата производится после завершения поездки\n4. В случае отмены заказа менее чем за 5 минут до подачи автомобиля, взимается штраф',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  ];

  return (
    <View style={styles.helpSection}>
      <Text style={styles.sectionTitle}>Помощь и поддержка</Text>
      {helpItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.helpItem}
          onPress={item.onPress}
        >
          <View style={styles.helpItemContent}>
            <Ionicons name={item.icon} size={24} color="#007AFF" />
            <View style={styles.helpItemText}>
              <Text style={styles.helpItemTitle}>{item.title}</Text>
              <Text style={styles.helpItemDescription}>{item.description}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const ProfileScreen = () => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRolePickerVisible, setIsRolePickerVisible] = useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Хасан',
    surname: 'Рахимбаев',
    role: 'Пассажир',
    avatar: '/assets/images/hasan.png',
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      date: '2024-03-20',
      status: 'open',
      subject: 'Проблема с оплатой'
    },
    {
      id: '2',
      date: '2024-03-19',
      status: 'closed',
      subject: 'Вопрос о тарифах'
    }
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([
    {
      id: '1',
      date: '2024-03-20',
      from: 'ул. Ленина, 10',
      to: 'ул. Гагарина, 5',
      price: 3500,
      paymentMethod: 'Карта',
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-03-19',
      from: 'пр. Мира, 15',
      to: 'ул. Пушкина, 8',
      price: 2800,
      paymentMethod: 'Наличные',
      status: 'completed'
    }
  ]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      lastFourDigits: '4242',
      isDefault: true,
      cardHolder: 'Хасан Р.',
      expiryDate: '12/25'
    },
    {
      id: '2',
      type: 'card',
      lastFourDigits: '8888',
      isDefault: false,
      cardHolder: 'Хасан Р.',
      expiryDate: '06/24'
    },
    {
      id: '3',
      type: 'cash',
      isDefault: false
    }
  ]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    {
      code: 'WELCOME2025',
      discount: 10,
      validUntil: '2025-12-31',
      isUsed: false
    }
  ]);
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [selectedRide, setSelectedRide] = useState<RideHistory | null>(null);
  const [isRideDetailsModalVisible, setIsRideDetailsModalVisible] = useState(false);
  const [isEditCardModalVisible, setIsEditCardModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PaymentMethod | null>(null);

  const fetchNotifications = async () => {
    try {
      console.log('Получение уведомлений...');
      
      const response = await fetch('http://192.168.217.205:5000/notifications', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Получены уведомления:', data);
      
      // Проверяем, что data является массивом
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.error('Получены некорректные данные:', data);
        setNotifications([]);
      }
      
    } catch (error: any) {
      console.error('Ошибка получения уведомлений:', error);
      setNotifications([]);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      console.log('Отметка уведомления как прочитанного:', id);
      
      const response = await fetch(`http://192.168.217.205:5000/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Обновляем состояние уведомлений
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      
    } catch (error: any) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
    }
  };

  // Обновляем уведомления каждые 30 секунд
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const handleEditPress = () => {
    setEditedProfile(profile);
    setIsEditModalVisible(true);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditModalVisible(false);
    Alert.alert('Успех', 'Профиль успешно обновлен');
  };

  const handleCancel = () => {
    setIsEditModalVisible(false);
  };

  const handleRoleSelect = (role: string) => {
    setEditedProfile({ ...editedProfile, role });
    setIsRolePickerVisible(false);
  };

  const pickImage = async (source: 'gallery' | 'camera') => {
    try {
      let result;
      
      if (source === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      }

      if (!result.canceled) {
        setEditedProfile({ ...editedProfile, avatar: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const handleEmergencyCall = (service: string, number: string) => {
    Alert.alert(
      `Вызов ${service}`,
      `Вы уверены, что хотите вызвать ${service}?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Вызвать',
          onPress: () => {
            Linking.openURL(`tel:${number}`);
          },
        },
      ]
    );
  };

  const handleReportEmergency = () => {
    Alert.alert(
      'Сообщить об экстренной ситуации',
      'Выберите тип экстренной ситуации:',
      [
        {
          text: 'ДТП',
          onPress: () => handleEmergencyCall('полицию', '102'),
        },
        {
          text: 'Пожар',
          onPress: () => handleEmergencyCall('пожарную службу', '101'),
        },
        {
          text: 'Медицинская помощь',
          onPress: () => handleEmergencyCall('скорую помощь', '103'),
        },
        {
          text: 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };

  const handleAddPromoCode = () => {
    if (newPromoCode.trim()) {
      setPromoCodes(prev => [...prev, {
        code: newPromoCode.toUpperCase(),
        discount: 10,
        validUntil: '2024-12-31',
        isUsed: false
      }]);
      setNewPromoCode('');
      setIsPromoModalVisible(false);
    }
  };

  const handleAddCard = () => {
    if (newCard.number && newCard.holder && newCard.expiry && newCard.cvv) {
      setPaymentMethods(prev => [...prev, {
        id: Date.now().toString(),
        type: 'card',
        lastFourDigits: newCard.number.slice(-4),
        isDefault: false,
        cardHolder: newCard.holder,
        expiryDate: newCard.expiry
      }]);
      setNewCard({ number: '', holder: '', expiry: '', cvv: '' });
      setIsAddCardModalVisible(false);
    }
  };

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const handleRidePress = (ride: RideHistory) => {
    setSelectedRide(ride);
    setIsRideDetailsModalVisible(true);
  };

  const handleEditCard = (card: PaymentMethod) => {
    setSelectedCard(card);
    setNewCard({
      number: `****${card.lastFourDigits}`,
      holder: card.cardHolder || '',
      expiry: card.expiryDate || '',
      cvv: ''
    });
    setIsEditCardModalVisible(true);
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Удаление карты',
      'Вы уверены, что хотите удалить эту карту?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== cardId));
          }
        }
      ]
    );
  };

  const handleUpdateCard = () => {
    if (selectedCard && newCard.holder && newCard.expiry) {
      setPaymentMethods(prev => prev.map(method => 
        method.id === selectedCard.id
          ? {
              ...method,
              cardHolder: newCard.holder,
              expiryDate: newCard.expiry
            }
          : method
      ));
      setNewCard({ number: '', holder: '', expiry: '', cvv: '' });
      setSelectedCard(null);
      setIsEditCardModalVisible(false);
    }
  };

  const renderRideHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>История поездок</Text>
      {rideHistory.map(ride => (
        <TouchableOpacity
          key={ride.id}
          style={styles.rideItem}
          onPress={() => handleRidePress(ride)}
        >
          <View style={styles.rideHeader}>
            <Text style={styles.rideDate}>{ride.date}</Text>
            <Text style={styles.ridePrice}>{ride.price}₸</Text>
          </View>
          <View style={styles.rideLocations}>
            <Text style={styles.rideLocation}>От: {ride.from}</Text>
            <Text style={styles.rideLocation}>До: {ride.to}</Text>
          </View>
          <View style={styles.rideFooter}>
            <Text style={styles.paymentMethod}>{ride.paymentMethod}</Text>
            <Text style={[
              styles.rideStatus,
              { color: ride.status === 'completed' ? '#4CAF50' : '#F44336' }
            ]}>
              {ride.status === 'completed' ? 'Завершено' : 'Отменено'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Способы оплаты</Text>
      {paymentMethods.map(method => (
        <View key={method.id} style={styles.paymentMethodItem}>
          <TouchableOpacity
            style={styles.paymentMethodLeft}
            onPress={() => handleSetDefaultPayment(method.id)}
          >
            <Ionicons 
              name={method.type === 'card' ? 'card-outline' : 'cash-outline'} 
              size={24} 
              color="#007AFF" 
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodType}>
                {method.type === 'card' ? 'Карта' : 'Наличные'}
              </Text>
              {method.type === 'card' && (
                <>
                  <Text style={styles.cardNumber}>**** {method.lastFourDigits}</Text>
                  <Text style={styles.cardDetails}>
                    {method.cardHolder} • {method.expiryDate}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.paymentMethodRight}>
            {method.isDefault && (
              <Text style={styles.defaultPayment}>По умолчанию</Text>
            )}
            <Ionicons 
              name={method.isDefault ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={method.isDefault ? "#4CAF50" : "#8E8E93"} 
            />
          </View>
          {method.type === 'card' && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => handleEditCard(method)}
              >
                <Ionicons name="pencil-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => handleDeleteCard(method.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.addCardButton}
        onPress={() => setIsAddCardModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.addCardButtonText}>Добавить карту</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPromoCodes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Промокоды</Text>
      {promoCodes.map(promo => (
        <View key={promo.code} style={styles.promoItem}>
          <View style={styles.promoInfo}>
            <Text style={styles.promoCode}>{promo.code}</Text>
            <Text style={styles.promoDiscount}>Скидка {promo.discount}%</Text>
          </View>
          <Text style={styles.promoValidUntil}>
            Действует до: {promo.validUntil}
          </Text>
          {promo.isUsed && (
            <Text style={styles.promoUsed}>Использован</Text>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.addPromoButton}
        onPress={() => setIsPromoModalVisible(true)}
      >
        <Text style={styles.addPromoButtonText}>Добавить промокод</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/hasan.png')} 
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.name} {profile.surname}</Text>
            <Text style={styles.userRole}>{profile.role}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="wallet-outline" size={24} color="#007AFF" />
              <Text style={styles.statValue}>45,000₸</Text>
              <Text style={styles.statLabel}>Потрачено</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statValue}>5.0</Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="gift-outline" size={24} color="#34C759" />
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Промокода</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditPress}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Редактировать профиль</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setIsSecurityModalVisible(true)}
          >
            <Ionicons name="shield-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Безопасность</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {renderRideHistory()}
        {renderPaymentMethods()}
        {renderPromoCodes()}

        <HelpSection />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Нет новых уведомлений</Text>
            }
          />
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Редактировать профиль</Text>
            
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: editedProfile.avatar }}
                style={styles.editAvatar}
              />
              <View style={styles.avatarButtons}>
                <TouchableOpacity 
                  style={[styles.avatarButton, styles.galleryButton]} 
                  onPress={() => pickImage('gallery')}
                >
                  <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.avatarButtonText}>Галерея</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.avatarButton, styles.cameraButton]} 
                  onPress={() => pickImage('camera')}
                >
                  <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.avatarButtonText}>Камера</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Имя</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.name}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                placeholder="Введите ваше имя"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Фамилия</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.surname}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, surname: text })}
                placeholder="Введите вашу фамилию"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Роль</Text>
              <TouchableOpacity 
                style={styles.roleSelector}
                onPress={() => setIsRolePickerVisible(true)}
              >
                <Text style={styles.roleSelectorText}>{editedProfile.role}</Text>
                <Ionicons name="chevron-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isRolePickerVisible}
        onRequestClose={() => setIsRolePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.rolePickerContent}>
            <Text style={styles.modalTitle}>Выберите роль</Text>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  editedProfile.role === role && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSelect(role)}
              >
                <Text style={[
                  styles.roleOptionText,
                  editedProfile.role === role && styles.roleOptionTextSelected
                ]}>
                  {role}
                </Text>
                {editedProfile.role === role && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSecurityModalVisible}
        onRequestClose={() => setIsSecurityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.securityContent}>
            <View style={styles.securityHeader}>
              <Text style={styles.modalTitle}>Безопасность</Text>
              <TouchableOpacity 
                onPress={() => setIsSecurityModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.emergencyButton, styles.policeButton]}
              onPress={() => handleEmergencyCall('полицию', '102')}
            >
              <Ionicons name="shield-outline" size={32} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Полиция</Text>
              <Text style={styles.emergencyNumber}>102</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.emergencyButton, styles.ambulanceButton]}
              onPress={() => handleEmergencyCall('скорую помощь', '103')}
            >
              <Ionicons name="medical-outline" size={32} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Скорая помощь</Text>
              <Text style={styles.emergencyNumber}>103</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.emergencyButton, styles.fireButton]}
              onPress={() => handleEmergencyCall('пожарную службу', '101')}
            >
              <Ionicons name="flame-outline" size={32} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Пожарная служба</Text>
              <Text style={styles.emergencyNumber}>101</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.emergencyButton, styles.reportButton]}
              onPress={handleReportEmergency}
            >
              <Ionicons name="warning-outline" size={32} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Сообщить об экстренной ситуации</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPromoModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить промокод</Text>
            <TextInput
              style={styles.promoInput}
              placeholder="Введите промокод"
              value={newPromoCode}
              onChangeText={setNewPromoCode}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsPromoModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddPromoCode}
              >
                <Text style={styles.modalButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAddCardModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить карту</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Номер карты"
              value={newCard.number}
              onChangeText={(text) => setNewCard({ ...newCard, number: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.cardInput}
              placeholder="Владелец карты"
              value={newCard.holder}
              onChangeText={(text) => setNewCard({ ...newCard, holder: text })}
            />
            <View style={styles.cardInputRow}>
              <TextInput
                style={[styles.cardInput, { flex: 1, marginRight: 10 }]}
                placeholder="MM/YY"
                value={newCard.expiry}
                onChangeText={(text) => setNewCard({ ...newCard, expiry: text })}
              />
              <TextInput
                style={[styles.cardInput, { flex: 1 }]}
                placeholder="CVV"
                value={newCard.cvv}
                onChangeText={(text) => setNewCard({ ...newCard, cvv: text })}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddCardModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCard}
              >
                <Text style={styles.modalButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRideDetailsModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Детали поездки</Text>
            {selectedRide && (
              <View style={styles.rideDetails}>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Дата:</Text>
                  <Text style={styles.rideDetailValue}>{selectedRide.date}</Text>
                </View>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Откуда:</Text>
                  <Text style={styles.rideDetailValue}>{selectedRide.from}</Text>
                </View>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Куда:</Text>
                  <Text style={styles.rideDetailValue}>{selectedRide.to}</Text>
                </View>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Стоимость:</Text>
                  <Text style={styles.rideDetailValue}>{selectedRide.price}₸</Text>
                </View>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Способ оплаты:</Text>
                  <Text style={styles.rideDetailValue}>{selectedRide.paymentMethod}</Text>
                </View>
                <View style={styles.rideDetailRow}>
                  <Text style={styles.rideDetailLabel}>Статус:</Text>
                  <Text style={[
                    styles.rideDetailValue,
                    { color: selectedRide.status === 'completed' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {selectedRide.status === 'completed' ? 'Завершено' : 'Отменено'}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setIsRideDetailsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditCardModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Редактировать карту</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Номер карты"
              value={newCard.number}
              editable={false}
            />
            <TextInput
              style={styles.cardInput}
              placeholder="Владелец карты"
              value={newCard.holder}
              onChangeText={(text) => setNewCard({ ...newCard, holder: text })}
            />
            <TextInput
              style={styles.cardInput}
              placeholder="MM/YY"
              value={newCard.expiry}
              onChangeText={(text) => setNewCard({ ...newCard, expiry: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditCardModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateCard}
              >
                <Text style={styles.modalButtonText}>Сохранить</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  avatarButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  galleryButton: {
    backgroundColor: '#007AFF',
  },
  cameraButton: {
    backgroundColor: '#34C759',
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  rolePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  roleOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#333',
  },
  roleOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  securityContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: '#FF3B30',
  },
  policeButton: {
    backgroundColor: '#007AFF',
  },
  ambulanceButton: {
    backgroundColor: '#FF3B30',
  },
  fireButton: {
    backgroundColor: '#FF9500',
  },
  reportButton: {
    backgroundColor: '#FF2D55',
  },
  emergencyButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  emergencyNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  helpSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  helpItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpItemText: {
    marginLeft: 15,
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContainer: {
    padding: 10,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
    borderColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    top: 15,
    right: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
    padding: 20,
  },
  rideItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideDate: {
    fontSize: 14,
    color: '#666',
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rideLocations: {
    marginBottom: 8,
  },
  rideLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  rideStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodType: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
  },
  defaultPayment: {
    fontSize: 12,
    color: '#4CAF50',
  },
  promoItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  promoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  promoDiscount: {
    fontSize: 14,
    color: '#4CAF50',
  },
  promoValidUntil: {
    fontSize: 12,
    color: '#666',
  },
  promoUsed: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  addPromoButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPromoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  promoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  addCardButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  cardInputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rideDetails: {
    marginBottom: 20,
  },
  rideDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  rideDetailLabel: {
    fontSize: 16,
    color: '#666',
  },
  rideDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  cardActionButton: {
    padding: 5,
    marginLeft: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default ProfileScreen; 
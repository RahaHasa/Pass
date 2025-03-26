import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Linking } from 'react-native';
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

const ROLES = ['Водитель', 'Пассажир'];

const ProfileScreen = () => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRolePickerVisible, setIsRolePickerVisible] = useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Иван',
    surname: 'Иванов',
    role: 'Водитель',
    avatar: 'https://via.placeholder.com/150',
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: profile.avatar }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile.name} {profile.surname}</Text>
        <Text style={styles.role}>{profile.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="car" size={24} color="#007AFF" />
            <Text style={styles.statValue}>150</Text>
            <Text style={styles.statLabel}>Поездок</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Рейтинг</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color="#34C759" />
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Время</Text>
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
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Уведомления</Text>
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

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  }
});

export default ProfileScreen; 
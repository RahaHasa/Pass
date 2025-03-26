import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export default function AppLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'index') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'monitoring') {
              iconName = focused ? 'speedometer' : 'speedometer-outline';
            } else if (route.name === 'profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Карта',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="monitoring"
          options={{
            title: 'Мониторинг',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Профиль',
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

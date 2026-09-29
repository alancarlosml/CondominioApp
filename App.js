// App.js – entry point (React Navigation)
// Import web polyfills first (only affects web platform)
import './web-polyfill';

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CondominioProvider } from '@/contexts/CondominioContext';
import { NotificationProvider, useNotification } from '@/contexts/NotificationContext';
import { theme } from '@/constants/theme';
import logger from '@/utils/logger';
import { configureNotificationHandler } from '@/services/pushNotifications';
import * as SplashScreen from 'expo-splash-screen';

// Manter a splash screen visível enquanto carregamos recursos
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignorar erros de splash */
});

// Screens
import CadastroScreen from '@/screens/CadastroScreen';
import CamerasScreen from '@/screens/CamerasScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import EncomendasScreen from '@/screens/EncomendasScreen';
import LoginScreen from '@/screens/LoginScreen';
import NotificacaoConfigScreen from '@/screens/NotificacaoConfigScreen';
import NotificacoesScreen from '@/screens/NotificacoesScreen';
import PortoesScreen from '@/screens/PortoesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SelectCondominioScreen from '@/screens/SelectCondominioScreen';
import SelectUnidadeScreen from '@/screens/SelectUnidadeScreen';
import MoradoresScreen from '@/screens/MoradoresScreen';
import VeiculosScreen from '@/screens/VeiculosScreen';
import AcessoScreen from '@/screens/AcessoScreen';
import ServicosScreen from '@/screens/ServicosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { unreadCount } = useNotification();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Acesso') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'Servicos') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Avisos') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Conta') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          ...theme.shadow.medium,
          // Removida altura fixa para respeitar safe areas do Android
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen name="Acesso" component={AcessoScreen} />
      <Tab.Screen name="Servicos" component={ServicosScreen} options={{ tabBarLabel: 'Serviços' }} />
      <Tab.Screen
        name="Avisos"
        component={NotificacoesScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Conta" component={ProfileScreen} options={{ tabBarLabel: 'Conta' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading, unidades } = useAuth();
  const navigationRef = useRef(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  // Reset navigation when auth state changes
  useEffect(() => {
    const handleNavigation = async () => {
      if (!loading && isReadyRef.current && navigationRef.current) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          logger.warn('SplashScreen.hideAsync error:', e);
        }

        logger.debug('AppNavigator: Estado de autenticação mudou', { isAuthenticated, unidadesCount: unidades?.length });
        if (isAuthenticated) {
          if (unidades && unidades.length > 1) {
            logger.debug('Navegando para SelectUnidade');
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'SelectUnidade' }],
            });
          } else {
            logger.debug('Navegando para Home');
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        } else {
          logger.debug('Navegando para Login (logout)');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        logger.debug('AppNavigator: Aguardando condições', { loading, isReady: isReadyRef.current, hasNavRef: !!navigationRef.current });
      }
    };

    handleNavigation();
  }, [isAuthenticated, loading, unidades]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        isReadyRef.current = true;
        // Initial navigation based on auth state
        if (navigationRef.current && !loading) {
          if (isAuthenticated) {
            // Se houver múltiplas unidades, navega para tela de seleção
            if (unidades && unidades.length > 1) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'SelectUnidade' }],
              });
            } else {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          } else {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen name="MeusVeiculos" component={VeiculosScreen} />
        <Stack.Screen name="MeusMoradores" component={MoradoresScreen} />
        <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
        <Stack.Screen name="NotificacaoConfig" component={NotificacaoConfigScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="SelectCondominio" component={SelectCondominioScreen} />
        <Stack.Screen name="SelectUnidade" component={SelectUnidadeScreen} />
        <Stack.Screen name="Portoes" component={PortoesScreen} />
        <Stack.Screen name="Cameras" component={CamerasScreen} />
        <Stack.Screen name="Encomendas" component={EncomendasScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <CondominioProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </CondominioProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

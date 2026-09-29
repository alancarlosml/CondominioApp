import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTypeDisplay } from '../utils/permissions';

export default function TestAuthScreen({ navigation }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [email, setEmail] = useState('marcuscosta3.infoma@gmail.com');
  const [senha, setSenha] = useState('12345678');
  const [loginMessage, setLoginMessage] = useState(null);

  // React to user changes after login
  useEffect(() => {
    if (isAuthenticated && user) {
      setLoginMessage(`Bem-vindo, ${user.nome}!`);
      // Clear message after 3 seconds
      const timer = setTimeout(() => setLoginMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Email e senha obrigatórios');
      return;
    }

    const result = await login(email, senha);
    if (!result.success) {
      Alert.alert('Erro', result.error);
    }
    // Success message will be shown via useEffect when user state updates
  };

  const getUserInfo = () => {
    if (!isAuthenticated || !user) {
      return 'Nenhum usuário logado';
    }

    return `[${getUserTypeDisplay(user.tipo_usuario)}] ${user.nome} - ${user.email}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isAuthenticated ? 'Usuario Logado' : 'Login'}</Text>

      <Text style={styles.userInfo}>{getUserInfo()}</Text>
      
      {loginMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>{loginMessage}</Text>
        </View>
      )}

      {!isAuthenticated ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
          />

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Senha"
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            console.log('👤 TestAuthScreen: Iniciando logout...');
            const result = await logout();
            if (result.success) {
              console.log('✅ TestAuthScreen: Logout concluído');
            } else {
              console.error('❌ TestAuthScreen: Erro no logout:', result.error);
              Alert.alert('Erro', result.error || 'Não foi possível fazer logout');
            }
          }}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Ir para Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  successText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

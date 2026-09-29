// src/screens/LoginScreen.js
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Storage from '@/utils/storage';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { validateCPF } from '@/utils/validators';
import logger from '@/utils/logger';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
const STORAGE_KEY_FAILED_ATTEMPTS = 'login_failed_attempts';
const STORAGE_KEY_BLOCK_UNTIL = 'login_block_until';

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrarMe, setLembrarMe] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState(null);

  // Carrega estado de bloqueio ao montar
  useEffect(() => {
    loadBlockState();
  }, []);

  const loadBlockState = async () => {
    try {
      const attempts = await Storage.getItem(STORAGE_KEY_FAILED_ATTEMPTS);
      const blockUntilStr = await Storage.getItem(STORAGE_KEY_BLOCK_UNTIL);

      if (attempts) {
        setFailedAttempts(parseInt(attempts, 10));
      }

      if (blockUntilStr) {
        const blockUntilTime = parseInt(blockUntilStr, 10);
        if (blockUntilTime > Date.now()) {
          setIsBlocked(true);
          setBlockUntil(blockUntilTime);
        } else {
          await Storage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
          await Storage.removeItem(STORAGE_KEY_BLOCK_UNTIL);
        }
      }
    } catch (error) {
      logger.error('Error loading block state:', error);
    }
  };

  const handleLogin = async () => {
    // Verifica se está bloqueado
    if (isBlocked && blockUntil && blockUntil > Date.now()) {
      const remaining = Math.ceil((blockUntil - Date.now()) / 1000 / 60);
      Alert.alert(
        'Conta temporariamente bloqueada',
        `Muitas tentativas falhadas. Tente novamente em ${remaining} minuto(s).`
      );
      return;
    }

    // Validação de campos
    if (!cpf || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Validação de CPF
    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
      Alert.alert('Erro', cpfValidation.error || 'CPF inválido');
      return;
    }

    const result = await login(cpf, senha);
    
    if (!result.success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      try {
        await Storage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, newAttempts.toString());
      } catch (error) {
        logger.error('Error saving failed attempts:', error);
      }

      if (newAttempts >= MAX_ATTEMPTS) {
        const blockUntilTime = Date.now() + BLOCK_DURATION;
        setIsBlocked(true);
        setBlockUntil(blockUntilTime);

        try {
          await Storage.setItem(STORAGE_KEY_BLOCK_UNTIL, blockUntilTime.toString());
        } catch (error) {
          logger.error('Error saving block time:', error);
        }
        
        Alert.alert(
          'Conta bloqueada',
          'Muitas tentativas falhadas. Sua conta foi bloqueada por 15 minutos.'
        );
      } else {
        Alert.alert(
          'Erro',
          `${result.error}\n\nTentativas restantes: ${MAX_ATTEMPTS - newAttempts}`
        );
      }
      return;
    }

    setFailedAttempts(0);
    setIsBlocked(false);
    setBlockUntil(null);
    try {
      await Storage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
      await Storage.removeItem(STORAGE_KEY_BLOCK_UNTIL);
    } catch (error) {
      logger.error('Error clearing block state:', error);
    }

    // Se houver múltiplas unidades, navega para tela de seleção
    if (result.hasMultipleUnidades) {
      navigation.replace('SelectUnidade');
    }
    // Se houver apenas uma unidade, a navegação será automática via AuthContext
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo-one-startup.png')} // Substitua pelo logo OSA
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu CPF"
              placeholderTextColor={theme.colors.textLight}
              value={cpf}
              onChangeText={(text) => {
                // Remove caracteres não numéricos enquanto digita
                const cpfLimpo = text.replace(/\D/g, '');
                // Formata CPF (xxx.xxx.xxx-xx) enquanto digita
                let formatted = cpfLimpo;
                if (cpfLimpo.length > 3) {
                  formatted = cpfLimpo.slice(0, 3) + '.' + cpfLimpo.slice(3);
                }
                if (cpfLimpo.length > 6) {
                  formatted = cpfLimpo.slice(0, 3) + '.' + cpfLimpo.slice(3, 6) + '.' + cpfLimpo.slice(6);
                }
                if (cpfLimpo.length > 9) {
                  formatted = cpfLimpo.slice(0, 3) + '.' + cpfLimpo.slice(3, 6) + '.' + cpfLimpo.slice(6, 9) + '-' + cpfLimpo.slice(9, 11);
                }
                setCpf(formatted);
              }}
              keyboardType="numeric"
              maxLength={14}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor={theme.colors.textLight}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setLembrarMe(!lembrarMe)}
          >
            <View style={[styles.checkbox, lembrarMe && styles.checkboxChecked]}>
              {lembrarMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Lembrar-me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Link para Cadastro */}
          <View style={styles.cadastroLink}>
            <Text style={styles.cadastroLinkText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.cadastroLinkButton}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  logo: {
    width: 150,
    height: 80,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  cadastroLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  cadastroLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  cadastroLinkButton: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

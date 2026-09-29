// src/screens/CadastroCondominoScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';
import { theme } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errorHandler';
import { validateCPF as validateCPFStrict, validateEmail as validateEmailStrict, validatePassword, validatePhone as validatePhoneStrict } from '@/utils/validators';
import logger from '@/utils/logger';

export default function CadastroCondominoScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    senha: '',
    confirmarSenha: '',
    unidade: '',
    bloco: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatCPF = (text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 3) {
        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3);
      }
      if (numbers.length > 6) {
        formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
      }
      if (numbers.length > 9) {
        formatted = formatted.slice(0, 11) + '-' + formatted.slice(11);
      }
      return formatted;
    }
    return formData.cpf;
  };

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 0) {
        formatted = '(' + numbers;
      }
      if (numbers.length > 2) {
        formatted = formatted.slice(0, 3) + ') ' + formatted.slice(3);
      }
      if (numbers.length > 7) {
        formatted = formatted.slice(0, 10) + '-' + formatted.slice(10);
      }
      return formatted;
    }
    return formData.telefone;
  };

  const handleChange = (field, value) => {
    if (field === 'cpf') {
      setFormData({ ...formData, [field]: formatCPF(value) });
    } else if (field === 'telefone') {
      setFormData({ ...formData, [field]: formatPhone(value) });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu nome completo');
      return false;
    }

    if (!validateEmailStrict(formData.email)) {
      Alert.alert('Erro', 'Por favor, informe um e-mail válido');
      return false;
    }

    const phoneCheck = validatePhoneStrict(formData.telefone);
    if (!phoneCheck.valid) {
      Alert.alert('Erro', phoneCheck.error || 'Por favor, informe um telefone válido');
      return false;
    }

    const cpfCheck = validateCPFStrict(formData.cpf);
    if (!cpfCheck.valid) {
      Alert.alert('Erro', cpfCheck.error || 'Por favor, informe um CPF válido');
      return false;
    }

    if (!formData.unidade.trim()) {
      Alert.alert('Erro', 'Por favor, informe sua unidade');
      return false;
    }

    // Validação de senha forte
    const passwordValidation = validatePassword(formData.senha);
    if (!passwordValidation.valid) {
      Alert.alert('Erro', passwordValidation.errors.join('\n'));
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/condomino/cadastro', {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        senha: formData.senha,
        unidade: formData.unidade,
        bloco: formData.bloco || null,
      });

      Alert.alert(
        'Sucesso!',
        'Cadastro realizado com sucesso. Aguarde a aprovação do síndico.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      logger.error('Erro cadastro:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cadastro</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
            <Text style={styles.welcomeText}>
              Preencha seus dados para se cadastrar no sistema do condomínio
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome Completo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.nome}
                  onChangeText={(value) => handleChange('nome', value)}
                  placeholder="Digite seu nome completo"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Telefone <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.telefone}
                  onChangeText={(value) => handleChange('telefone', value)}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>

            {/* CPF */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                CPF <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.cpf}
                  onChangeText={(value) => handleChange('cpf', value)}
                  placeholder="000.000.000-00"
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>
              Localização
            </Text>

            {/* Bloco */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bloco</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.bloco}
                  onChangeText={(value) => handleChange('bloco', value)}
                  placeholder="Ex: A, B, C (opcional)"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Unidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Unidade/Apartamento <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.unidade}
                  onChangeText={(value) => handleChange('unidade', value)}
                  placeholder="Ex: 101, 202, Casa 5"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>
              Segurança
            </Text>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.senha}
                  onChangeText={(value) => handleChange('senha', value)}
                  placeholder="Mínimo 8 caracteres, com maiúscula, número e símbolo"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={formData.confirmarSenha}
                  onChangeText={(value) => handleChange('confirmarSenha', value)}
                  placeholder="Digite a senha novamente"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
              <Text style={styles.infoText}>
                Seu cadastro será enviado para aprovação do síndico. Você receberá um e-mail quando for aprovado.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Cadastrando...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.white} />
                  <Text style={styles.submitButtonText}>Criar Cadastro</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Já possui cadastro? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkButton}>Fazer Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.small,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  loginLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  loginLinkButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
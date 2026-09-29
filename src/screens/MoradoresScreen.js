// src/screens/MoradoresScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { theme } from '@/constants/theme';
import { useCondominio } from '@/contexts/CondominioContext';
import { createMorador, deleteMorador, fetchMoradores, updateMorador } from '@/services/moradoresApi';
import { getErrorMessage } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { validateCPF, validateEmail, validatePhone } from '@/utils/validators';

const IMAGE_BASE_URL = 'https://face.onestartup.com.br/imagens/';
const MAX_FOTO_BYTES = 200 * 1024; // 200KB

export default function MoradoresScreen({ navigation }) {
  const { selectedCondominio } = useCondominio();
  const [moradores, setMoradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMorador, setEditingMorador] = useState(null);
  const [detailMorador, setDetailMorador] = useState(null);

  // form fields - obrigatorios: nome, cpf | opcionais: data_nascimento, email, telefone, obs, foto
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [obs, setObs] = useState('');
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoSizeKb, setFotoSizeKb] = useState(null);

  const getUnidade = useCallback(() => {
    if (!selectedCondominio) return null;
    return selectedCondominio.unidade_usuario || selectedCondominio.apartamento || selectedCondominio.unidade || null;
  }, [selectedCondominio]);

  const getCondominioId = useCallback(() => {
    if (!selectedCondominio) return null;
    return selectedCondominio.id_tbl_condominio || selectedCondominio.id || null;
  }, [selectedCondominio]);

  useEffect(() => {
    if (getCondominioId() && getUnidade()) loadMoradores();
  }, [getCondominioId, getUnidade]);

  useFocusEffect(
    useCallback(() => {
      if (getCondominioId() && getUnidade()) loadMoradores();
    }, [getCondominioId, getUnidade])
  );

  const loadMoradores = async () => {
    const idCondominio = getCondominioId();
    const unidade = getUnidade();
    if (!idCondominio || !unidade) {
      setMoradores([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetchMoradores(idCondominio, unidade);
      const data = response.data;
      // API retorna { sucesso: true, moradores: [] }
      if (data?.moradores && Array.isArray(data.moradores)) {
        setMoradores(data.moradores);
        logger.debug(`${data.moradores.length} morador(es) carregado(s)`);
      } else if (Array.isArray(data)) {
        setMoradores(data);
      } else {
        logger.warn('Resposta da API não contém moradores válidos');
        setMoradores([]);
      }
    } catch (error) {
      // No web com CORS, não alertar - só log debug e lista vazia
      const isCors = error?.code === 'ERR_NETWORK' || error?.message?.includes('CORS') || error?.message === 'Network Error';
      if (isCors && Platform.OS === 'web') {
        logger.debug('Moradores não carregado no web (CORS) - use Expo Go');
        setMoradores([]);
      } else {
        logger.error('Erro ao carregar moradores:', error);
        Alert.alert('Erro', getErrorMessage(error));
        setMoradores([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingMorador(null);
    setNome('');
    setCpf('');
    setDataNascimento('');
    setEmail('');
    setTelefone('');
    setObs('');
    setFotoUri(null);
    setFotoSizeKb(null);
    setModalVisible(true);
  };

  const openEditModal = (morador) => {
    setDetailMorador(null);
    setEditingMorador(morador);
    setNome(morador.nome || '');
    setCpf(morador.cpf || '');
    setDataNascimento(morador.data_nascimento ? String(morador.data_nascimento).substring(0, 10) : '');
    setEmail(morador.email || '');
    setTelefone(morador.telefone ? String(morador.telefone).replace(/\D/g, '') : '');
    setObs(morador.obs || '');
    setFotoUri(null);
    setFotoSizeKb(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMorador(null);
    setNome('');
    setCpf('');
    setDataNascimento('');
    setEmail('');
    setTelefone('');
    setObs('');
    setFotoUri(null);
    setFotoSizeKb(null);
  };

  const formatCPF = (text) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 9) formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`;
    else if (cleaned.length > 6) formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6)}`;
    else if (cleaned.length > 3) formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3)}`;
    setCpf(formatted);
  };

  const formatTelefone = (text) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 11);
    setTelefone(cleaned);
  };

  const formatDataNascimento = (text) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 6) formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
    else if (cleaned.length > 4) formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}`;
    setDataNascimento(formatted);
  };

  // Tamanho via API nova do expo-file-system (SDK 57: classe File; getInfoAsync legado falha)
  const getFotoSizeBytes = (uri) => {
    try {
      const f = new File(uri);
      if (!f.exists) return null;
      return typeof f.size === 'number' ? f.size : null;
    } catch {
      return null;
    }
  };

  const checkFotoSize = async (uri) => {
    // No web o FileSystem não lê blob: da galeria/câmera — validação real é no envio (blob.size)
    if (Platform.OS === 'web') {
      setFotoSizeKb(null);
      return true;
    }
    const size = getFotoSizeBytes(uri);
    if (size == null) {
      // Sem leitura local: deixa passar, servidor valida 190KB e session retorna erro tratável
      logger.debug('Tamanho da foto indisponível localmente, validando no envio');
      setFotoSizeKb(null);
      return true;
    }
    const kb = size / 1024;
    setFotoSizeKb(kb);
    if (size > MAX_FOTO_BYTES) {
      Alert.alert(
        'Foto muito grande',
        `A foto tem ${kb.toFixed(0)}KB e o limite é 200KB. Escolha uma imagem menor ou com menor qualidade.`
      );
      return false;
    }
    return true;
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para selecionar foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const ok = await checkFotoSize(uri);
      if (ok) setFotoUri(uri);
      else {
        // still set but will block on save; clear to force reselect
        setFotoUri(null);
        setFotoSizeKb(null);
      }
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à câmera para tirar foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const ok = await checkFotoSize(uri);
      if (ok) setFotoUri(uri);
      else {
        setFotoUri(null);
        setFotoSizeKb(null);
      }
    }
  };

  const handlePickFoto = () => {
    Alert.alert('Foto do morador', 'Foto opcional - máx. 200KB', [
      { text: 'Galeria', onPress: pickFromLibrary },
      { text: 'Câmera', onPress: pickFromCamera },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const nomeTrim = nome.trim();
    const cpfClean = cpf.replace(/\D/g, '');

    if (!nomeTrim || nomeTrim.length < 3) {
      Alert.alert('Erro', 'Informe o nome completo (mín. 3 caracteres)');
      return;
    }
    if (!cpfClean || cpfClean.length !== 11) {
      Alert.alert('Erro', 'CPF deve ter 11 dígitos');
      return;
    }
    const cpfValidation = validateCPF(cpfClean);
    if (!cpfValidation.valid) {
      Alert.alert('Erro', cpfValidation.error || 'CPF inválido');
      return;
    }
    const idCondominio = getCondominioId();
    const unidade = getUnidade();
    if (!idCondominio || !unidade) {
      Alert.alert('Erro', 'Condomínio/unidade não identificados. Selecione novamente a unidade.');
      return;
    }
    if (dataNascimento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
        Alert.alert('Erro', 'Data de nascimento deve estar no formato AAAA-MM-DD (ex: 1990-05-10)');
        return;
      }
    }
    if (email && !validateEmail(email)) {
      Alert.alert('Erro', 'E-mail inválido');
      return;
    }
    if (telefone) {
      const phoneValidation = validatePhone(telefone);
      if (!phoneValidation.valid) {
        Alert.alert('Erro', phoneValidation.error);
        return;
      }
    }
    if (fotoUri && Platform.OS !== 'web') {
      // Só valida tamanho no nativo; no web fetch blob é mais confiável no envio
      const size = getFotoSizeBytes(fotoUri);
      if (size != null && size > MAX_FOTO_BYTES) {
        Alert.alert('Erro', `Foto com ${(size / 1024).toFixed(0)}KB excede o limite de 200KB`);
        return;
      }
    }

    // Monta a parte da foto: {blob,filename} no web | {uri,name,type} no nativo | null sem foto.
    // Lança {cancelled:true} após Alert quando a validação barra o envio.
    const prepareFotoPart = async () => {
      if (!fotoUri) return null;
      if (Platform.OS === 'web') {
        // No web, converte blob URI para Blob/File
        try {
          const resp = await fetch(fotoUri);
          const blob = await resp.blob();
          if (blob.size > MAX_FOTO_BYTES) {
            Alert.alert('Erro', `Foto com ${(blob.size / 1024).toFixed(0)}KB excede o limite de 200KB`);
            throw { cancelled: true };
          }
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          return { blob, filename: `foto_${Date.now()}.${ext}` };
        } catch (e) {
          if (e?.cancelled) throw e;
          logger.warn('Erro ao converter foto web', e);
          // fallback: tenta enviar uri direto (alguns browsers aceitam)
          return { value: fotoUri };
        }
      }
      // Nativo (EXPO_PUBLIC_USE_RN_FETCH=true): stack clássico do RN, que
      // suporta parte {uri} via módulo de rede nativo. Redimensiona p/
      // tamanho ideal (máx 800px, JPEG, file:// garantido) antes de anexar.
      try {
        const manip = await manipulateAsync(
          fotoUri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        logger.debug('Foto convertida p/ upload', { uri: manip.uri });
        return { uri: manip.uri, name: `foto_${Date.now()}.jpg`, type: 'image/jpeg' };
      } catch (e) {
        logger.warn('Erro ao ler foto para upload:', e?.message || String(e));
        Alert.alert('Erro', 'Não foi possível ler a foto selecionada. Tente outra imagem.');
        throw { cancelled: true };
      }
    };

    const appendFotoPart = (formData, fotoPart) => {
      if (!fotoPart) return;
      if (fotoPart.blob) formData.append('foto', fotoPart.blob, fotoPart.filename);
      else if (fotoPart.uri) {
        // @ts-ignore - parte {uri} suportada pelo XHR clássico do RN
        formData.append('foto', { uri: fotoPart.uri, name: fotoPart.name, type: fotoPart.type });
      }
      else if (fotoPart.value) formData.append('foto', fotoPart.value);
    };

    setSaving(true);
    try {
      let fotoPart = null;
      try {
        fotoPart = await prepareFotoPart();
      } catch (e) {
        if (e?.cancelled) {
          setSaving(false);
          return;
        }
        throw e;
      }

      logger.debug('Enviando morador', {
        idCondominio, unidade, nome: nomeTrim, cpf: cpfClean,
        hasFoto: !!fotoPart, editando: !!editingMorador,
      });
      const t0 = Date.now();
      let response;
      try {
        if (editingMorador) {
          const fields = {
            nome: nomeTrim,
            cpf: cpfClean,
            data_nascimento: dataNascimento || '',
            email: email.trim(),
            telefone: telefone.replace(/\D/g, ''),
            obs: obs.trim(),
            id_tbl_condominio: String(idCondominio),
            unidade: String(unidade),
          };
          const foto = !fotoPart
            ? null
            : fotoPart.blob
              ? { blob: fotoPart.blob, filename: fotoPart.filename }
              : fotoPart.uri
                ? { uri: fotoPart.uri, name: fotoPart.name, type: fotoPart.type }
                : null;
          response = await updateMorador(editingMorador.id_tbl_condomino, fields, foto);
        } else {
          const formData = new FormData();
          formData.append('nome', nomeTrim);
          formData.append('cpf', cpfClean);
          formData.append('id_tbl_condominio', String(idCondominio));
          formData.append('unidade', String(unidade));
          if (dataNascimento) formData.append('data_nascimento', dataNascimento);
          if (email) formData.append('email', email.trim());
          if (telefone) formData.append('telefone', telefone.replace(/\D/g, ''));
          formData.append('obs', obs.trim() || 'Morador');
          appendFotoPart(formData, fotoPart);
          response = await createMorador(formData);
        }
      } finally {
        logger.debug('Moradores save durou (ms):', Date.now() - t0);
      }
      logger.debug('Resposta save morador', response.data);
      if (response.data?.sucesso === false) {
        throw new Error(response.data?.mensagem || response.data?.message || 'Erro ao salvar');
      }
      Alert.alert(
        'Sucesso',
        response.data?.mensagem || (editingMorador ? 'Morador atualizado com sucesso.' : 'Morador cadastrado com sucesso.')
      );
      closeModal();
      await loadMoradores();
    } catch (error) {
      logger.error('Erro ao salvar morador:', error);
      logger.error('Detalhes:', {
        url: error?.config?.url,
        method: error?.config?.method,
        code: error?.code,
        message: error?.message,
        status: error?.response?.status ?? error?.status,
        responseData: typeof error?.response?.data === 'string'
          ? error.response.data.substring(0, 300)
          : error?.response?.data,
        hasRequest: !!error?.request,
        requestHeaders: error?.config?.headers,
        isWeb: Platform.OS === 'web',
      });
      const msg = getErrorMessage(error);
      const isNetwork = error?.code === 'ERR_NETWORK' || error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error' || error?.message?.includes('ERR_FAILED');
      const isCors = isNetwork || error?.message?.includes('CORS') || error?.message?.includes('blocked by CORS');
      if (isCors && Platform.OS === 'web') {
        Alert.alert(
          'Navegador bloqueado (CORS)',
          'O backend https://face.onestartup.com.br não libera CORS para localhost. Teste no celular:\n\n1. Rode: npm start\n2. Escaneie o QR no Expo Go\n\nNo celular o cadastro funciona (sem CORS).'
        );
      } else if (isNetwork) {
        Alert.alert('Sem conexão', `${msg}\n\nVerifique internet e se https://face.onestartup.com.br está acessível. Se estiver no navegador, teste no celular.`);
      } else {
        Alert.alert('Erro', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (morador) => {
    const idCondominio = getCondominioId();
    const unidade = getUnidade();
    try {
      setLoading(true);
      await deleteMorador(morador.id_tbl_condomino, idCondominio, unidade);
      Alert.alert('Sucesso', 'Morador excluído com sucesso.');
      setDetailMorador(null);
      await loadMoradores();
    } catch (error) {
      logger.error('Erro ao excluir morador:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (morador) => {
    Alert.alert('Excluir Pessoa', `Deseja realmente excluir ${morador.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => executeDelete(morador) },
    ]);
  };

  const renderMorador = ({ item }) => {
    const fotoUrl = item.foto ? `${IMAGE_BASE_URL}${item.foto}` : null;
    const iniciais = (item.nome || 'U').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <View style={styles.card} accessibilityLabel={`Morador ${item.nome}`}>
        <TouchableOpacity
          style={styles.cardDetailArea}
          onPress={() => setDetailMorador(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Ver detalhes de ${item.nome}`}
          accessibilityRole="button"
        >
          <View style={styles.avatar}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{iniciais}</Text>
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
            <Text style={styles.cardCpf}>CPF: {item.cpf}</Text>
            {item.obs ? <Text style={styles.cardObs} numberOfLines={1}>{item.obs}</Text> : null}
            {item.data_nascimento ? (
              <Text style={styles.cardObs}>Nasc: {String(item.data_nascimento).substring(0, 10)}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            accessibilityLabel="Editar pessoa"
            accessibilityRole="button"
          >
            <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            accessibilityLabel="Excluir pessoa"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDetailRow = (label, value) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{String(value)}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (!getCondominioId() || !getUnidade()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Nenhuma unidade selecionada</Text>
          <Text style={styles.emptyText}>Selecione uma unidade para visualizar as pessoas</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={theme.colors.textLight} />
        <Text style={styles.emptyTitle}>Nenhuma pessoa cadastrada</Text>
        <Text style={styles.emptyText}>Toque no botão + para cadastrar dependentes, visitantes ou prestadores</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Voltar" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pessoas</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={moradores}
        keyExtractor={(item) => String(item.id_tbl_condomino || item.id || item.cpf || Math.random())}
        renderItem={renderMorador}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMoradores} colors={[theme.colors.primary]} />}
      />

      <TouchableOpacity
        style={styles.fabButton}
        onPress={openNewModal}
        activeOpacity={0.8}
        accessibilityLabel="Cadastrar pessoa"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMorador ? 'Editar Pessoa' : 'Nova Pessoa'}</Text>
              <TouchableOpacity onPress={closeModal} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo *</Text>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="João da Silva"
                  editable={!saving}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput
                  style={styles.input}
                  value={cpf}
                  onChangeText={formatCPF}
                  placeholder="000.000.000-00"
                  keyboardType="numeric"
                  maxLength={14}
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de nascimento</Text>
                <TextInput
                  style={styles.input}
                  value={dataNascimento}
                  onChangeText={formatDataNascimento}
                  placeholder="1990-05-10 (opcional)"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="joao@email.com (opcional)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={formatTelefone}
                  placeholder="98999999999 (opcional)"
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observação</Text>
                <TextInput
                  style={[styles.input, { minHeight: 44 }]}
                  value={obs}
                  onChangeText={setObs}
                  placeholder="Morador / Dependente / Visitante (opcional)"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Foto (opcional)</Text>
                {editingMorador?.foto && !fotoUri ? (
                  <View style={styles.currentFotoRow}>
                    <Image source={{ uri: `${IMAGE_BASE_URL}${editingMorador.foto}` }} style={styles.currentFoto} />
                    <Text style={styles.helperText}>Foto atual — selecione outra para trocar</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={styles.fotoPicker} onPress={handlePickFoto} disabled={saving}>
                  {fotoUri ? (
                    <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                  ) : (
                    <View style={styles.fotoPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={theme.colors.textLight} />
                      <Text style={styles.fotoPlaceholderText}>Toque para selecionar</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.helperText}>Foto opcional - máx. 200KB (recomendado 600x800 JPG)</Text>
                {fotoSizeKb ? (
                  <Text style={[styles.helperText, fotoSizeKb > 200 && { color: theme.colors.error }]}>
                    Tamanho: {fotoSizeKb.toFixed(0)}KB / 200KB
                  </Text>
                ) : null}
                {fotoUri ? (
                  <TouchableOpacity onPress={() => { setFotoUri(null); setFotoSizeKb(null); }} style={styles.removeFotoBtn}>
                    <Text style={styles.removeFotoText}>Remover foto</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.condominioInfo}>
                <Ionicons name="business-outline" size={16} color={theme.colors.textLight} />
                <Text style={styles.condominioInfoText}>
                  Cond: {getCondominioId() || '-'} • Unidade: {getUnidade() || '-'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Salvando...' : editingMorador ? 'Atualizar Pessoa' : 'Salvar Pessoa'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!detailMorador} animationType="slide" transparent onRequestClose={() => setDetailMorador(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes</Text>
              <TouchableOpacity onPress={() => setDetailMorador(null)} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {detailMorador ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {detailMorador.foto ? (
                  <Image source={{ uri: `${IMAGE_BASE_URL}${detailMorador.foto}` }} style={styles.detailFoto} />
                ) : null}
                {renderDetailRow('Nome', detailMorador.nome)}
                {renderDetailRow('CPF', detailMorador.cpf)}
                {renderDetailRow(
                  'Nascimento',
                  detailMorador.data_nascimento ? String(detailMorador.data_nascimento).substring(0, 10) : null
                )}
                {renderDetailRow('E-mail', detailMorador.email)}
                {renderDetailRow('Telefone', detailMorador.telefone)}
                {renderDetailRow('Observação', detailMorador.obs)}
                {renderDetailRow('Unidade', detailMorador.unidade)}
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.detailEditBtn]}
                    onPress={() => openEditModal(detailMorador)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={18} color={theme.colors.white} />
                    <Text style={styles.detailActionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.detailDeleteBtn]}
                    onPress={() => handleDelete(detailMorador)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.white} />
                    <Text style={styles.detailActionText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 16 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  headerTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text },
  listContent: { padding: theme.spacing.lg },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.medium,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.primary },
  cardDetailArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: theme.fontSize.lg, fontWeight: 'bold', color: theme.colors.text, marginBottom: 2 },
  cardCpf: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  cardObs: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentFotoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  currentFoto: { width: 64, height: 84, borderRadius: theme.borderRadius.md, resizeMode: 'cover' },
  detailFoto: { width: '100%', height: 260, borderRadius: theme.borderRadius.lg, resizeMode: 'cover', marginBottom: theme.spacing.lg },
  detailRow: { marginBottom: theme.spacing.md },
  detailLabel: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.textLight, marginBottom: 2 },
  detailValue: { fontSize: theme.fontSize.lg, color: theme.colors.text },
  detailActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  detailEditBtn: { backgroundColor: theme.colors.primary },
  detailDeleteBtn: { backgroundColor: theme.colors.error },
  detailActionText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl * 2 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
  fabButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.large,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '92%',
    paddingBottom: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold', color: theme.colors.text },
  modalBody: { padding: theme.spacing.lg },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  fotoPicker: {
    height: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  fotoPlaceholder: { alignItems: 'center', gap: 6 },
  fotoPlaceholderText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  helperText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginTop: 6 },
  removeFotoBtn: { marginTop: 8, alignSelf: 'flex-start' },
  removeFotoText: { color: theme.colors.error, fontSize: theme.fontSize.sm, fontWeight: '600' },
  condominioInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 },
  condominioInfoText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: theme.colors.white, fontSize: theme.fontSize.lg, fontWeight: 'bold' },
});

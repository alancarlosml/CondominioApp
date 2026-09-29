/**
 * API de encomendas - usa cliente autenticado api.js
 */
import api from '@/services/api';
import Constants from 'expo-constants';

const DEVICE_API_BASE =
  Constants.expoConfig?.extra?.apiUrl?.replace(/\/morador\/?$/, '/api') ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/morador\/?$/, '/api') ||
  'https://face.onestartup.com.br/api';

export function fetchEntregas(idUnidade) {
  return api.get(`${DEVICE_API_BASE}/listar_entregas.php`, {
    params: { id_unidade: idUnidade },
    timeout: 15000,
    headers: { Accept: 'application/json' },
  });
}

export function confirmarEntrega(codigoHash, status = '1') {
  return api.put(
    `${DEVICE_API_BASE}/encomenda.php`,
    { codigoHash, status },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    }
  );
}

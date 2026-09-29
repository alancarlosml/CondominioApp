/**
 * API de veículos - usa cliente autenticado api.js
 */
import api from '@/services/api';
import Constants from 'expo-constants';

const DEVICE_API_BASE =
  Constants.expoConfig?.extra?.apiUrl?.replace(/\/morador\/?$/, '/api') ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/morador\/?$/, '/api') ||
  'https://face.onestartup.com.br/api';

export function fetchVeiculos(idUnidade) {
  return api.get(`${DEVICE_API_BASE}/veiculos.php`, {
    params: { unidade: idUnidade },
    timeout: 10000,
    headers: { Accept: 'application/json' },
  });
}

export function createVeiculo(payload) {
  return api.post(`${DEVICE_API_BASE}/veiculos.php`, payload, {
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
}

export function updateVeiculo(idVeiculo, payload) {
  return api.put(`${DEVICE_API_BASE}/veiculos.php`, payload, {
    params: { id: idVeiculo },
    timeout: 10000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
}

export function deleteVeiculo(idVeiculo) {
  return api.delete(`${DEVICE_API_BASE}/veiculos.php`, {
    params: { id: idVeiculo },
    timeout: 10000,
    headers: { Accept: 'application/json' },
  });
}

/**
 * API de dispositivos (CFTV e aparelhos/portões).
 * Reutiliza o cliente autenticado de api.js.
 */
import Constants from 'expo-constants';
import api from '@/services/api';

const DEVICE_API_BASE =
  Constants.expoConfig?.extra?.apiUrl?.replace(/\/morador\/?$/, '/api') ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/morador\/?$/, '/api') ||
  'https://face.onestartup.com.br/api';

export function fetchCameras(idCondominio) {
  return api.get(`${DEVICE_API_BASE}/api_cftv.php`, {
    params: { id_tbl_condominio: idCondominio },
    headers: { Accept: 'application/json' },
  });
}

export function fetchAparelhos(idCondominio) {
  return api.get(`${DEVICE_API_BASE}/api_aparelho.php`, {
    params: { id_tbl_condominio: idCondominio },
    headers: { Accept: 'application/json' },
  });
}

export async function openGate(payload) {
  const config = {
    timeout: 20000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  const url = `${DEVICE_API_BASE}/api_aparelho.php`;

  try {
    // Abertura de portão é uma ação física: repetir automaticamente após
    // timeout/erro 5xx pode acionar o relé duas vezes.
    return await api.put(url, payload, config);
  } catch (error) {
    throw enrichGateError(error);
  }
}

function enrichGateError(error) {
  const data = error.response?.data;
  const rawMessage =
    data?.mensagem ||
    data?.erro ||
    data?.message ||
    error.message ||
    'Não foi possível abrir o portão. Tente novamente.';

  const message = formatGateErrorMessage(rawMessage);

  return {
    ...error,
    message,
    gateErrorMessage: message,
    status: error.response?.status ?? error.status,
  };
}

/** Traduz erros de infraestrutura do backend para mensagem clara ao morador. */
export function formatGateErrorMessage(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'Não foi possível abrir o portão. Tente novamente.';
  }

  if (/no route to host|connection refused|failed to connect|192\.168\./i.test(rawMessage)) {
    // Não exponha IPs, topologia ou detalhes de infraestrutura ao morador.
    return 'Não foi possível comunicar com o portão. A administração foi orientada a verificar o equipamento.';
  }

  return rawMessage;
}

/**
 * Retorna id_tbl_condomino válido ou null se ausente.
 */
export function getIdCondomino(selectedCondominio) {
  const id = selectedCondominio?.id_condomino;
  if (id == null || id === '') return null;
  const parsed = parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Encontra aparelho vinculado à câmera (por hash2 ou id).
 */
export function findAparelhoForCamera(aparelhos, cameraRef) {
  if (!cameraRef || !aparelhos?.length) return null;
  return aparelhos.find(
    (ap) =>
      ap.hash2 === cameraRef ||
      String(ap.id_tbl_aparelho) === String(cameraRef)
  ) ?? null;
}

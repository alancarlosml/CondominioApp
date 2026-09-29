/**
 * API de moradores/pessoas - reconhecimento facial
 * POST multipart/form-data e GET por condominio+unidade
 * @see https://face.onestartup.com.br/api/moradores.php
 */
import Constants from 'expo-constants';
import api from '@/services/api';
import * as Storage from '@/utils/storage';

const DEVICE_API_BASE =
  Constants.expoConfig?.extra?.apiUrl?.replace(/\/morador\/?$/, '/api') ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/morador\/?$/, '/api') ||
  'https://face.onestartup.com.br/api';

/**
 * Lista moradores por condomínio e unidade
 * GET /moradores.php?id_tbl_condominio=1&unidade=101
 * @param {string|number} idCondominio
 * @param {string|number} unidade - unidade_usuario (ex: 101)
 */
export function fetchMoradores(idCondominio, unidade) {
  return api.get(`${DEVICE_API_BASE}/moradores.php`, {
    params: { id_tbl_condominio: idCondominio, unidade },
    timeout: 35000,
    headers: { Accept: 'application/json' },
  });
}

/**
 * Cadastra morador com foto opcional (multipart/form-data)
 * Campos obrigatórios: nome, cpf, id_tbl_condominio, unidade
 * Opcionais: data_nascimento (YYYY-MM-DD), email, telefone, obs, foto
 *
 * Usa fetch nativo em vez de axios: o axios (dispatchRequest) força
 * `Content-Type: application/x-www-form-urlencoded` em todo POST sem
 * Content-Type — o navegador corrige p/ multipart+boundary no send(FormData),
 * mas o XHR do React Native envia o header literal e o servidor derruba a
 * conexão (ERR_NETWORK instantâneo). No fetch sem Content-Type o RN gera o
 * multipart correto sozinho.
 * @param {FormData} formData
 */
async function getAuthHeaders() {
  let token = null;
  try {
    token = await Storage.getItem('token');
  } catch {
    token = null;
  }
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseApiResponse(res, url, method, headers) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data?.mensagem || data?.message || `Request failed with status code ${res.status}`;
    throw Object.assign(new Error(msg), {
      code: 'ERR_BAD_REQUEST',
      config: { url, method, headers },
      response: { status: res.status, data },
    });
  }
  return { data, status: res.status };
}

function toNetworkError(e, url, method) {
  if (e?.name === 'AbortError') {
    return Object.assign(new Error('timeout exceeded'), {
      code: 'ECONNABORTED',
      config: { url, method },
    });
  }
  if (!e?.response) {
    return Object.assign(new Error('Network Error'), {
      code: 'ERR_NETWORK',
      config: { url, method },
      cause: e,
    });
  }
  return e;
}

export async function createMorador(formData, { timeoutMs = 60000 } = {}) {
  const url = `${DEVICE_API_BASE}/moradores.php`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = await getAuthHeaders();
    // NUNCA definir Content-Type aqui
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    return await parseApiResponse(res, url, 'post', headers);
  } catch (e) {
    throw toNetworkError(e, url, 'post');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Atualiza morador (PUT /moradores.php?id_tbl_condomino=ID)
 * payload: { nome?, cpf?, data_nascimento?, email?, telefone?, obs?,
 *            id_tbl_condominio (obrigatório), unidade (obrigatório) }
 * foto: { blob, filename } opcional — se presente envia multipart (servidor
 * precisa do patch PUT-multipart); sem foto envia JSON (compatível com atual).
 */
export async function updateMorador(idMorador, payload, foto = null, { timeoutMs = 60000 } = {}) {
  const url = `${DEVICE_API_BASE}/moradores.php?id_tbl_condomino=${encodeURIComponent(idMorador)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = await getAuthHeaders();
    let body;
    if (foto) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') formData.append(k, String(v));
      });
      if (foto.blob) {
        formData.append('foto', foto.blob, foto.filename);
      } else {
        // Nativo: parte {uri} suportada pelo XHR clássico do RN
        formData.append('foto', {
          uri: foto.uri,
          name: foto.name || foto.filename,
          type: foto.type,
        });
      }
      body = formData;
      // NUNCA definir Content-Type no multipart
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body,
      signal: controller.signal,
    });
    return await parseApiResponse(res, url, 'put', headers);
  } catch (e) {
    throw toNetworkError(e, url, 'put');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Exclui morador (DELETE /moradores.php?id_tbl_condomino=X&id_tbl_condominio=Y&unidade=Z)
 */
export function deleteMorador(idMorador, idCondominio, unidade) {
  return api.delete(`${DEVICE_API_BASE}/moradores.php`, {
    params: {
      id_tbl_condomino: idMorador,
      id_tbl_condominio: idCondominio,
      unidade,
    },
    timeout: 15000,
    headers: { Accept: 'application/json' },
  });
}

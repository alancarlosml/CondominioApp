/**
 * Sistema de logging seguro para produção
 * Logs são desabilitados automaticamente em produção
 */

const isDev = __DEV__;

/**
 * Sanitiza dados sensíveis antes de logar
 */
const sensitiveKeys = new Set([
  'cpf', 'senha', 'password', 'token', 'access_token', 'refresh_token',
  'authorization', 'email', 'telefone', 'phone', 'foto', 'face',
]);

const sanitizeData = (data, seen = new WeakSet()) => {
  if (!data || typeof data !== 'object') return data;
  if (seen.has(data)) return '[Circular]';
  seen.add(data);

  if (Array.isArray(data)) return data.map((item) => sanitizeData(item, seen));

  const sanitized = {};
  Object.keys(data).forEach((key) => {
    sanitized[key] = sensitiveKeys.has(key.toLowerCase())
      ? '***'
      : sanitizeData(data[key], seen);
  });
  return sanitized;
};

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args.map(arg => typeof arg === 'object' ? sanitizeData(arg) : arg));
    }
  },
  
  warn: (...args) => {
    if (isDev) {
      console.warn(...args.map(arg => typeof arg === 'object' ? sanitizeData(arg) : arg));
    }
  },
  
  error: (...args) => {
    // Erros sempre logam, mas sanitizados
    const sanitizedArgs = args.map(arg => typeof arg === 'object' ? sanitizeData(arg) : arg);
    
    if (isDev) {
      console.error(...sanitizedArgs);
    } else {
      // Em produção, encaminhe somente eventos sanitizados a um serviço de
      // monitoramento. Não escreva dados em logs persistentes do aparelho.
      // Exemplo: Sentry.captureException(...sanitizedArgs);
    }
  },
  
  debug: (...args) => {
    if (isDev) {
      console.debug(...args.map(arg => typeof arg === 'object' ? sanitizeData(arg) : arg));
    }
  },
  
  info: (...args) => {
    if (isDev) {
      console.info(...args.map(arg => typeof arg === 'object' ? sanitizeData(arg) : arg));
    }
  },
};

export default logger;

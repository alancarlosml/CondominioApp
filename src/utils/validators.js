/**
 * Validações de dados do usuário
 */

/**
 * Valida CPF verificando dígitos verificadores
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateCPF = (cpf) => {
  // Remove formatação
  const numbers = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numbers)) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  return { valid: true };
};

/**
 * Valida força da senha
 * @param {string} password - Senha a validar
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  if (password && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  if (password && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone a validar
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validatePhone = (phone) => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length < 10 || numbers.length > 11) {
    return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  return { valid: true };
};

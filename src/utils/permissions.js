// src/utils/permissions.js

/**
 * Define permissões e funcionalidades disponíveis para cada tipo de usuário
 * Baseado na tabela tbl_usuario (tipo_usuario)
 */

export const USER_TYPES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  RESIDENTE: 'residente'
};

export const PERMISSIONS = {
  // Acesso básico
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  VIEW_NOTIFICATIONS: 'view_notifications',

  // Veículos
  VIEW_VEHICLES: 'view_vehicles',
  MANAGE_VEHICLES: 'manage_vehicles',

  // Moradores/Pessoas (facial) - foto 200KB max, só titular futuramente
  VIEW_MORADORES: 'view_moradores',
  MANAGE_MORADORES: 'manage_moradores',

  // Portões
  VIEW_GATES: 'view_gates',
  CONTROL_GATES: 'control_gates',

  // Encomendas
  VIEW_DELIVERIES: 'view_deliveries',
  MANAGE_DELIVERIES: 'manage_deliveries',

  // CCTV
  VIEW_CCTV: 'view_cctv',
  MANAGE_CCTV: 'manage_cctv',

  // Acessos/Histórico
  VIEW_ACCESS_HISTORY: 'view_access_history',
  MANAGE_ACCESS_HISTORY: 'manage_access_history',

  // Gestão do condomínio (apenas admin)
  MANAGE_CONDOMINIO: 'manage_condominio',
  MANAGE_USERS: 'manage_users',
  MANAGE_DEVICES: 'manage_devices'
};

const PERMISSION_MATRIX = {
  [USER_TYPES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_MORADORES,
    PERMISSIONS.MANAGE_MORADORES,
    PERMISSIONS.VIEW_GATES,
    PERMISSIONS.CONTROL_GATES,
    PERMISSIONS.VIEW_DELIVERIES,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.VIEW_CCTV,
    PERMISSIONS.MANAGE_CCTV,
    PERMISSIONS.VIEW_ACCESS_HISTORY,
    PERMISSIONS.MANAGE_ACCESS_HISTORY,
    PERMISSIONS.MANAGE_CONDOMINIO,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_DEVICES
  ],

  [USER_TYPES.SUPERVISOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MORADORES,
    PERMISSIONS.VIEW_GATES,
    PERMISSIONS.CONTROL_GATES,
    PERMISSIONS.VIEW_DELIVERIES,
    PERMISSIONS.VIEW_CCTV,
    PERMISSIONS.VIEW_ACCESS_HISTORY,
    PERMISSIONS.MANAGE_ACCESS_HISTORY
  ],

  [USER_TYPES.RESIDENTE]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_MORADORES,
    PERMISSIONS.MANAGE_MORADORES,
    PERMISSIONS.VIEW_GATES,
    PERMISSIONS.CONTROL_GATES,
    PERMISSIONS.VIEW_DELIVERIES,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.VIEW_CCTV
  ]
};

/**
 * Verifica se um usuário tem uma permissão específica
 * @param {string} userType - Tipo do usuário
 * @param {string} permission - Permissão a verificar
 * @returns {boolean} - True se tem permissão, false caso contrário
 */
export const hasPermission = (userType, permission) => {
  if (!userType || !permission) return false;

  const userPermissions = PERMISSION_MATRIX[userType] || [];
  return userPermissions.includes(permission);
};

/**
 * Retorna menu items disponíveis para o tipo de usuário
 * @param {string} userType - Tipo do usuário
 * @returns {Array} - Array de itens de menu
 */
export const getAvailableMenuItems = (userType) => {
  const baseItems = [
    {
      id: 'vehicles',
      title: 'Meus Veículos',
      icon: 'car-outline',
      screen: 'MeusVeiculos',
      color: '#f39c12',
      permission: PERMISSIONS.VIEW_VEHICLES
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: 'notifications-outline',
      screen: 'Notificacoes',
      color: '#3498db',
      permission: PERMISSIONS.VIEW_NOTIFICATIONS
    }
  ];

  const adminItems = [
    {
      id: 'history',
      title: 'Histórico de Acessos',
      icon: 'time-outline',
      screen: 'AccessHistory',
      color: '#9b59b6',
      permission: PERMISSIONS.VIEW_ACCESS_HISTORY
    },
    {
      id: 'manage_cond',
      title: 'Gerenciar Condomínio',
      icon: 'business-outline',
      screen: 'ManageCondominio',
      color: '#2ecc71',
      permission: PERMISSIONS.MANAGE_CONDOMINIO
    },
    {
      id: 'manage_users',
      title: 'Gerenciar Usuários',
      icon: 'people-outline',
      screen: 'ManageUsers',
      color: '#e74c3c',
      permission: PERMISSIONS.MANAGE_USERS
    }
  ];

  const supervisorItems = [
    {
      id: 'history',
      title: 'Histórico de Acessos',
      icon: 'time-outline',
      screen: 'AccessHistory',
      color: '#9b59b6',
      permission: PERMISSIONS.VIEW_ACCESS_HISTORY
    }
  ];

  let menuItems = [...baseItems];

  if (userType === USER_TYPES.ADMIN) {
    menuItems = [...menuItems, ...adminItems];
  } else if (userType === USER_TYPES.SUPERVISOR) {
    menuItems = [...menuItems, ...supervisorItems];
  }

  // Filtrar apenas itens que o usuário tem permissão
  return menuItems.filter(item => hasPermission(userType, item.permission));
};

/**
 * Retorna ações rápidas disponíveis no dashboard
 * @param {string} userType - Tipo do usuário
 * @returns {Array} - Array de ações rápidas
 */
export const getAvailableQuickActions = (userType) => {
  const actions = [
    {
      id: 1,
      title: 'Portão Veículo',
      icon: 'car-outline',
      color: '#27ae60',
      screen: 'Portoes',
      params: { type: 'vehicle' },
      permission: PERMISSIONS.CONTROL_GATES
    },
    {
      id: 2,
      title: 'Portão Pedestre',
      icon: 'walk-outline',
      color: '#e74c3c',
      screen: 'Portoes',
      params: { type: 'pedestrian' },
      permission: PERMISSIONS.CONTROL_GATES
    },
    {
      id: 3,
      title: 'Encomendas',
      icon: 'cube-outline',
      color: '#f39c12',
      screen: 'Encomendas',
      permission: PERMISSIONS.VIEW_DELIVERIES
    },
    {
      id: 4,
      title: 'Câmeras',
      icon: 'videocam-outline',
      color: '#9b59b6',
      screen: 'Cameras',
      permission: PERMISSIONS.VIEW_CCTV
    }
  ];

  return actions.filter(action => hasPermission(userType, action.permission));
};

/**
 * Retorna label amigável para o tipo de usuário
 * @param {string} userType - Tipo do usuário
 * @returns {string} - Label formatado
 */
export const getUserTypeDisplay = (userType) => {
  switch (userType) {
    case USER_TYPES.ADMIN: return 'Administrador';
    case USER_TYPES.SUPERVISOR: return 'Supervisor';
    case USER_TYPES.RESIDENTE: return 'Residente';
    default: return 'Usuário';
  }
};

/**
 * Verifica se usuário pode gerenciar (CRUD) uma entidade
 * @param {string} userType - Tipo do usuário
 * @param {string} entity - entidade (vehicles, deliveries, etc)
 * @returns {boolean} - True se pode gerenciar
 */
export const canManage = (userType, entity) => {
  const managePermissionMap = {
    vehicles: PERMISSIONS.MANAGE_VEHICLES,
    moradores: PERMISSIONS.MANAGE_MORADORES,
    deliveries: PERMISSIONS.MANAGE_DELIVERIES,
    condominio: PERMISSIONS.MANAGE_CONDOMINIO,
    users: PERMISSIONS.MANAGE_USERS,
    devices: PERMISSIONS.MANAGE_DEVICES,
    cctv: PERMISSIONS.MANAGE_CCTV,
    access: PERMISSIONS.MANAGE_ACCESS_HISTORY
  };

  const permission = managePermissionMap[entity];
  return permission ? hasPermission(userType, permission) : false;
};

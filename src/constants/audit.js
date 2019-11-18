// TODO: add desensitized info in api to take the place of code below
export const TYPES_ROLLBACK_SUPPORT = [
  { name: 'UPDATE_SERVICE', mayBeDesensitized: true },
  { name: 'DELETE_SERVICE', mayBeDesensitized: true },
  { name: 'UPDATE_SWITCH', mayBeDesensitized: true },
  { name: 'DELETE_SWITCH', mayBeDesensitized: true },
  { name: 'UPDATE_CONFIG', mayBeDesensitized: true },
  { name: 'DELETE_CONFIG', mayBeDesensitized: true },
  { name: 'ASSIGN_CLUSTER_LINK', mayBeDesensitized: false },
  { name: 'DELETE_CLUSTER_LINK', mayBeDesensitized: false },
  { name: 'UPDATE_ROUTE', mayBeDesensitized: false },
  { name: 'DELETE_ROUTE', mayBeDesensitized: false },
  { name: 'UPDATE_INFRA_CONFIG', mayBeDesensitized: true },
  { name: 'DELETE_INFRA_CONFIG', mayBeDesensitized: true },
];

export const TYPE_DELETE_SERVICE = 'DELETE_SERVICE';
export const TYPE_UPDATE_INFRA_CONFIG = 'UPDATE_INFRA_CONFIG';
export const TYPE_DELETE_INFRA_CONFIG = 'DELETE_INFRA_CONFIG';
export const TYPE_DELETE_ROUTE = 'DELETE_ROUTE';

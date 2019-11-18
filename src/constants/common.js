export const OVERALL_CLUSTER = 'overall';
export const RESERVED_CLUSTER_NAME = ['overall', 'default', 'global'];

export const INFRA_PREFIX_LIST = ['infra.', 'redis.'];

export const ENCRYPTION_PREFIX = '==ENCRYPTION(joke)==';

export const RELEASE_WINDOW_IN_RUSH_HOURS = '0';
export const RELEASE_WINDOW_READ_ONLY_ON = '1';
export const RELEASE_WINDOW_OPEN_FOR_EMERGENCY_USER = '-2';
export const RELEASE_WINDOW_READ_ONLY_BYPASS = 'bypass';

export const MODIFIED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const RESERVED_CONFIG_KEY_PREFIX_LIST = ['PUBLIC_'];
const RESERVED_CONFIG_KEY_LIST = [];
export const isReservedConfigKey = key => (
  RESERVED_CONFIG_KEY_PREFIX_LIST.find(prefix => key.startsWith(prefix))
  || RESERVED_CONFIG_KEY_LIST.find(k => key === k)
);

export const INTENT_DIRECT = 'direct';

export const SWITCH_RELATED_FIRST_LEVEL_PATHS = [];
export const SWITCH_RELATED_THREE_LEVEL_PATHS = ['switch'];

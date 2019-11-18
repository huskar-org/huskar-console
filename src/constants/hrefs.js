import { MONITOR_URL } from './env';

export const USER_MANUAL_URL = 'http://example.com/huskar_user_manual';
export const HUSKAR_ISSUE_URL = 'http://example.com/huskar-fe/issues';
export const PERMISSION_APPLY_URL = 'http://example.com/huskar_new_user';
export const INFRA_CONFIG_APPLY_WIKI_URL = 'http://example.com/apply';
export const BEACON_METAL_URL = host => `${MONITOR_URL}/?host=${host}`;
export const BEACON_CONTAINER_URL = cid => `http://example.com/?cid=${cid}`;
export const BEACON_TRACE_URL = ip => `http://example.com/?ip=${ip}`;
export const ROUTE_PROGRAM_WIKI = {
  INTRO: 'http://example.com',
  USER_MANUAL: 'https://example.com/route_program_user_manual',
};
export const INFRA_PROGRAM_WIKI = {
  INTRO: 'http://example.com/naming-service',
  USER_MANUAL: 'http://example.com/naming-service/user-manual',
  OPTIONS_DETAIL_DATABASE: 'http://example.com/Database',
  OPTIONS_DETAIL_REDIS: 'http://example.com/Redis',
  OPTIONS_DETAIL_AMQP: 'http://example.com/AMQP',
  OPTIONS_DETAIL_OSS: 'http://example.com/OSS',
  OPTIONS_DETAIL_KAFKA: 'http://example.com/Kafka',
};
export const CLUSTER_LINK_URL = 'http://example.com/cluster';

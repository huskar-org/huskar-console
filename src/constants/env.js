import _ from 'lodash';

export const DEBUG = process.env.NODE_ENV !== 'production';
export const FEATURE_LIST = _.fromPairs(
  process.env.HUSKAR_FEATURE_LIST.trim().split(',').map(v => [v, true]),
);
export const EZONE_LIST = process.env.HUSKAR_EZONE_LIST.trim().split(',');
export const MONITOR_URL = process.env.HUSKAR_MONITOR_URL.trim();
export const DEFAULT_CLUSTER = process.env.HUSKAR_DEFAULT_CLUSTER.trim();
export const CLUSTER_SPEC_URL = process.env.HUSKAR_CLUSTER_SPEC_URL.trim();
export const AMQP_DASHBOARD_URL = (process.env.HUSKAR_AMQP_DASHBOARD_URL || '').trim();
export const ES_DASHBOARD_URL = (process.env.HUSKAR_ES_DASHBOARD_URL || '').trim();
export const ROUTE_EZONE_CLUSTERS = (
  process.env.HUSKAR_ROUTE_EZONE_CLUSTER_LIST.trim()
    ? _.fromPairs(
      process.env.HUSKAR_ROUTE_EZONE_CLUSTER_LIST
        .trim().split(',').map(x => x.trim().split(':')),
    ) : []
);
export const READ_ONLY_EXCLUSIVE_PATHS = process.env.HUSKAR_READ_ONLY_EXCLUSIVE_PATHS.trim().split(',');
export const ROUTE_ADMIN_ONLY_EZONE = process.env.HUSKAR_ROUTE_ADMIN_ONLY_EZONE.trim().split(',');

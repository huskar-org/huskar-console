import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-14';

configure({ adapter: new Adapter() });

process.env = {
  NODE_ENV: 'test',
  HUSKAR_SENTRY_DSN: '',
  HUSKAR_RELEASE_ID: '',
  HUSKAR_MONITOR_URL: '',
  HUSKAR_AMQP_DASHBOARD_URL: '',
  HUSKAR_ES_DASHBOARD_URL: '',
  HUSKAR_FEATURE_LIST: 'stateswitch',
  HUSKAR_EZONE_LIST: 'global,alta1',
  HUSKAR_DEFAULT_CLUSTER: '',
  HUSKAR_CLUSTER_SPEC_URL: '',
  HUSKAR_ROUTE_EZONE_CLUSTER_LIST: ' ',
  HUSKAR_READ_ONLY_EXCLUSIVE_PATHS: '',
  HUSKAR_ROUTE_ADMIN_ONLY_EZONE: '',
};

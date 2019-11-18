import Apisdk from 'apisdk';
import ajax from './ajax';
import './toast';
import './minimal';
import { parseApiPath } from './utils';

const apiList = [
  '* /whoami',
  '* /config/:application/:cluster/:key',
  '* /config/:application/:cluster',
  '* /config/:application',
  '* /switch/:application/:cluster/:key',
  '* /switch/:application/:cluster',
  '* /switch/:application',
  '* /service/:application/:cluster/:key',
  '* /service/:application/:cluster',
  '* /service/:application',
  '* /serviceinfo/:application',
  '* /serviceinfo/:application/:cluster',
  '* /servicelink/:application/:cluster',
  '* /serviceroute/default/:application',
  '* /serviceroute/:application/:cluster',
  '* /serviceroute/:application/:cluster/:destination',
  '* /batch_config',
  '* /batch_switch',
  '* /batch_service',
  '* /application',
  '* /application/:application_name',
  '* /application/:application_name/token',
  '* /team',
  '* /team/:team',
  '* /auth/team/:team',
  '* /auth/application/:application',
  '* /auth/huskar',
  '* /auth/huskar/:username',
  '* /auth/token',
  '* /user',
  '* /user/:username',
  '* /user/:username/password-reset',
  '* /replication/:application',
  'GET /audit/site',
  'GET /audit/team/:name',
  'GET /audit/application/:application_name',
  'PUT,DELETE /infra-config/:applicationName/:infraType/:infraName',
  'GET,POST /infra-config-downstream/:applicationName',
  'PUT /audit-rollback/:application/:auditID',
  'GET /audit-timeline/config/:application/:cluster/:key',
  'GET /audit-timeline/switch/:application/:cluster/:key',
  'GET /audit-timeline/service/:application/:cluster/:key',
  'GET,POST /_internal/arch/route-program',
  'POST /_check-infra-connective',
  'GET /.well-known/common',
];

const applicationApiList = apiList.map((api) => {
  const path = api.split(' ')[1]
    .replace(':application_name', ':application').replace(':applicationName', ':application');
  if (!path.includes(':application')) {
    return null;
  }

  return new RegExp(`^/api${path.replace(':application', '([^/]+)').replace(/:[^/]+/g, '[^/]+')}$`);
}).filter(v => v);

const clusterApiList = apiList.map((api) => {
  const path = api.split(' ')[1];
  const placeholder = ':cluster';
  if (!path.includes(placeholder)) {
    return null;
  }

  return new RegExp(`^/api${path.replace(placeholder, '([^/]+)').replace(/:[^/]+/g, '[^/]+')}$`);
}).filter(v => v);

const applicationApiGroup = {
  inPath: applicationApiList,
  inQuery: {
    application: [
      new RegExp('^/api/batch_config$'),
      new RegExp('^/api/batch_switch$'),
      new RegExp('^/api/batch_service$'),
    ],
  },
  inFormData: {
    application: [
      new RegExp('^/api/batch_config$'),
      new RegExp('^/api/batch_switch$'),
    ],
  },
};

const switchApiGroup = {
  inPath: [
    new RegExp('^/api/switch/'),
    new RegExp('^/api/batch_switch'),
  ],
};

const clusterApiGroup = {
  inPath: clusterApiList,
  inQuery: {
    scope_name: [
      new RegExp('^/api/infra-config/'),
    ],
  },
};

export default new Apisdk(apiList,
  ajax((url, data) => parseApiPath(
    url, data, applicationApiGroup, switchApiGroup, clusterApiGroup,
  )));

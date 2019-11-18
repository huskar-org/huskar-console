import { AMQP_DASHBOARD_URL, ES_DASHBOARD_URL } from './env';
import { INFRA_PROGRAM_WIKI } from './hrefs';

class Option {
  constructor(key, label = '', required = true, defaultValue = '', notes = {}) {
    this.key = key;
    this.label = label || key;
    this.required = required;
    this.defaultValue = defaultValue;
    this.inputType = 'text';
    this.notes = notes;
  }

  validate(value) {
    return !value ? !this.required : true;
  }

  // eslint-disable-next-line class-methods-use-this
  toStr(value) {
    return value;
  }

  // eslint-disable-next-line class-methods-use-this
  toJS(value) {
    return String(value);
  }
}

class StringOption extends Option {}

class PositiveIntegerOption extends Option {
  constructor(key, label = '', required = true, defaultValue = '', notes = {}) {
    super(key, label, required, defaultValue, notes);
    this.inputType = 'number';
  }

  validate(value) {
    if (!value) {
      return !this.required;
    }
    if (Number.isNaN(value)) {
      return false;
    }
    const number = Number(value);
    return number >= 0 && Number.isInteger(number);
  }

  // eslint-disable-next-line class-methods-use-this
  toStr(value) {
    return value === undefined ? '' : String(value);
  }

  // eslint-disable-next-line class-methods-use-this
  toJS(value) {
    return Number(value);
  }
}

class BooleanOption extends Option {
  constructor(key, label = '', required = true, defaultValue = '', notes = {}) {
    super(key, label, required, defaultValue, notes);
    this.inputType = 'boolean';
  }

  validate(value) {
    if (!value) {
      return !this.required;
    }
    return value === 'true' || value === 'false';
  }

  // eslint-disable-next-line class-methods-use-this
  toStr(value) {
    return value === undefined ? '' : String(value);
  }

  // eslint-disable-next-line class-methods-use-this
  toJS(value) {
    return value === 'true';
  }
}

export const INFRA_CONFIG_TYPES = {
  FX_DATABASE_SETTINGS: {
    label: 'Database',
    codeName: 'database',
    providerName: 'DAL',
    propType: PropTypes => PropTypes.shape({
      master: PropTypes.string,
      slave: PropTypes.string,
    }),
    pattern: /^dal\..+$/,
    protocols: ['mysql', 'pgsql'],
    urlAttributes: ['master', 'slave'],
    urlBuilder: v => (
      `sam+${v.infraProtocol}://${v.username}:${v.password}@${v.applicationName}/${v.clusterName}/${v.dbName}`
    ),
    urlParser: ({ protocol, hostname, port, username, password, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      const scheme = /(?:sam\+)?([a-z]+):/.exec(protocol);
      const urlPath = pathname.split('/');
      return {
        isRawUrl,
        infraProtocol: (scheme && scheme[1]) ? scheme[1] : '',
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : urlPath[1],
        dbName: isRawUrl ? urlPath[1] : urlPath[2],
        hostname: isRawUrl ? hostname : null,
        port: isRawUrl ? port : null,
        username: decodeURIComponent(username),
        password: decodeURIComponent(password),
      };
    },
    urlComponents: ['applicationName', 'clusterName', 'infraProtocol', 'dbName', 'username', 'password'],
    options: [
      new PositiveIntegerOption(
        'max_pool_size', 'Max pool size', false, '',
        { helps: ['连接池初始大小，正整数'] },
      ),
      new PositiveIntegerOption(
        'max_pool_overflow', 'Max pool overflow', false, '',
        { helps: ['连接池满时最多可建的池外连接数，正整数'] },
      ),
      new StringOption(
        'jdbc.urlParameters', 'jdbc.urlParameters', false, '',
        { helps: ['JDBC 的 URL 扩展 queryString，格式：a=aa&b=bb 形式'] },
      ),
    ],
    optionsDetailLink: INFRA_PROGRAM_WIKI.OPTIONS_DETAIL_DATABASE,
    applicationNameFilter: v => v,
  },
  FX_REDIS_SETTINGS: {
    label: 'Redis',
    codeName: 'redis',
    providerName: 'Redis',
    propType: PropTypes => PropTypes.shape({
      url: PropTypes.string,
    }),
    pattern: /^redis\..+$/,
    protocols: ['redis'],
    urlAttributes: ['url'],
    urlBuilder: v => `sam+redis://${v.applicationName}/${v.clusterName}`,
    urlParser: ({ protocol, hostname, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      return {
        isRawUrl,
        infraProtocol: 'redis',
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : pathname.split('/')[1] || '',
      };
    },
    urlComponents: ['applicationName', 'clusterName', 'infraProtocol'],
    options: [
      new PositiveIntegerOption(
        'max_pool_size', 'Max pool size', false, '100',
        { helps: ['连接池最大连接数，正整数', '> java: 一个 pool 最多有多少个状态为 idle 的 jedis 实例'] },
      ),
      new PositiveIntegerOption(
        'connect_timeout', 'Connect timeout(s)', false, '5',
        {
          helps: [
            '获取连接的阻塞超时时间，正整数，单位：秒',
          ],
        },
      ),
      new BooleanOption(
        'jedis.testOnBorrow', 'jedis.testOnBorrow', false, 'false',
        { helps: ['在 borrow 一个 jedis 实例时，是否提前进行 validate 操作'] },
      ),
      new BooleanOption(
        'jedis.testOnReturn', 'jedis.testOnReturn', false, 'false',
        { helps: ['在 return 给 pool 时，是否提前进行 validate 操作'] },
      ),
    ],
    optionsDetailLink: INFRA_PROGRAM_WIKI.OPTIONS_DETAIL_REDIS,
    applicationNameFilter: v => v,
  },
  FX_AMQP_SETTINGS: {
    label: 'Message Queue',
    codeName: 'amqp',
    providerName: 'RMQ',
    propType: PropTypes => PropTypes.shape({
      url: PropTypes.string,
    }),
    pattern: /^ampq\..+$/,
    protocols: ['amqp'],
    urlAttributes: ['url'],
    urlBuilder: v => (
      `sam+amqp://${v.username}:${v.password}@${v.applicationName}/${v.clusterName}/${v.vHost}`
    ),
    urlParser: ({ protocol, hostname, port, username, password, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      const urlPath = pathname.split('/');
      return {
        isRawUrl,
        infraProtocol: 'amqp',
        username: decodeURIComponent(username),
        password: decodeURIComponent(password),
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : urlPath[1],
        vHost: isRawUrl ? urlPath[1] : urlPath[2],
        hostname: isRawUrl ? hostname : null,
        port: isRawUrl ? port : null,
      };
    },
    urlComponents: ['infraProtocol', 'applicationName', 'clusterName', 'username', 'password', 'vHost'],
    options: [
      new PositiveIntegerOption(
        'connection_pool_size', 'Connection Pool Size', false, '60',
        { helps: ['连接池最大连接数，正整数'] },
      ),
      new PositiveIntegerOption(
        'channel_pool_size', 'Channel Pool Size', false, '60',
        { helps: ['channel 池最大连接数，正整数'] },
      ),
      new PositiveIntegerOption(
        'write_timeout', 'Write Timeout(ms)', false, '10000',
        { helps: ['publish 超时时间，正整数，单位：毫秒'] },
      ),
      new BooleanOption(
        'auto_recover', 'Auto Recover', false, 'true',
        { helps: ['是否自动重连，boolean'] },
      ),
      new PositiveIntegerOption(
        'heartbeat', 'Heartbeat(s)', false, '60',
        { helps: ['心跳时间，正整数，单位：秒'] },
      ),
    ],
    optionsDetailLink: INFRA_PROGRAM_WIKI.OPTIONS_DETAIL_AMQP,
    applicationNameFilter: v => v,
  },
  FX_ES_SETTINGS: {
    label: 'Elasticsearch',
    codeName: 'es',
    providerName: 'Elasticsearch',
    propType: PropTypes => PropTypes.shape({
      url: PropTypes.string,
    }),
    pattern: /^es\..+$/,
    protocols: ['http', 'transport'],
    urlAttributes: ['url'],
    urlBuilder: v => (
      `sam+${v.infraProtocol}://${v.applicationName}/${v.clusterName}`
    ),
    urlParser: ({ protocol, hostname, port, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      const scheme = /(?:sam\+)?(.+):/.exec(protocol);
      const urlPath = pathname.split('/');
      return {
        isRawUrl,
        infraProtocol: (scheme && scheme[1]) ? scheme[1] : '',
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : urlPath[1],
        hostname: isRawUrl ? hostname : null,
        port: isRawUrl ? port : null,
      };
    },
    urlComponents: ['infraProtocol', 'applicationName', 'clusterName'],
    options: [],
    optionsDetailLink: '',
    applicationNameFilter: v => v,
  },
  FX_OSS_SETTINGS: {
    label: 'OSS',
    codeName: 'oss',
    providerName: 'OSS',
    propType: PropTypes => PropTypes.shape({
      url: PropTypes.string,
    }),
    pattern: /^oss\..+$/,
    protocols: ['http'],
    urlAttributes: ['url'],
    urlBuilder: v => (
      `sam+${v.infraProtocol}://${v.accessID}:${v.secretKey}@${v.applicationName}/${v.clusterName}`
    ),
    urlParser: ({ protocol, hostname, port, username, password, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      const scheme = /(?:sam\+)?(.+):/.exec(protocol);
      const urlPath = pathname.split('/');
      return {
        isRawUrl,
        infraProtocol: (scheme && scheme[1]) ? scheme[1] : '',
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : urlPath[1],
        hostname: isRawUrl ? hostname : null,
        port: isRawUrl ? port : null,
        accessID: decodeURIComponent(username),
        secretKey: decodeURIComponent(password),
      };
    },
    urlComponents: ['infraProtocol', 'applicationName', 'clusterName', 'accessID', 'secretKey'],
    options: [
      new PositiveIntegerOption(
        'max_pool_size', 'Max Pool Size', false, '100',
        { helps: ['连接池最大连接数，正整数'] },
      ),
      new PositiveIntegerOption(
        'connect_timeout_ms', 'Connect Timeout(ms)', false, '3000',
        { helps: ['连接建立超时时间，正整数，单位：毫秒'] },
      ),
      new PositiveIntegerOption(
        'idle_timeout_ms', 'Idle Timeout(ms)', false, '10000',
        { helps: ['空闲连接默认的超时时间，正整数，单位：毫秒'] },
      ),
      new PositiveIntegerOption(
        'max_error_retry', 'Max Error Retry', false, '3',
        { helps: ['请求错误（5xx response）的最大重试次数，正整数'] },
      ),
    ],
    optionsDetailLink: INFRA_PROGRAM_WIKI.OPTIONS_DETAIL_OSS,
    applicationNameFilter: v => v,
  },
  FX_KAFKA_SETTINGS: {
    label: 'Message Queue',
    codeName: 'kafka',
    providerName: 'Kafka',
    propType: PropTypes => PropTypes.shape({
      url: PropTypes.string,
    }),
    pattern: /^kafka\..+$/,
    protocols: ['kafka'],
    urlAttributes: ['url'],
    urlBuilder: v => (
      `sam+${v.infraProtocol}://${v.applicationName}/${v.clusterName}`
    ),
    urlParser: ({ protocol, hostname, port, pathname }) => {
      const isRawUrl = !protocol.startsWith('sam+');
      const scheme = /(?:sam\+)?(.+):/.exec(protocol);
      const urlPath = pathname.split('/');
      return {
        isRawUrl,
        infraProtocol: (scheme && scheme[1]) ? scheme[1] : '',
        applicationName: isRawUrl ? '' : hostname,
        clusterName: isRawUrl ? '' : urlPath[1],
        hostname: isRawUrl ? hostname : null,
        port: isRawUrl ? port : null,
      };
    },
    urlComponents: ['infraProtocol', 'applicationName', 'clusterName'],
    options: [
      new StringOption(
        'group.id', 'group.id', false, '',
        { helps: ['group.id specifies the name of the consumer group a Kafka consumer belongs to.'] },
      ),
    ],
    optionsDetailLink: INFRA_PROGRAM_WIKI.OPTIONS_DETAIL_KAFKA,
    applicationNameFilter: v => v,
  },
};
export const INFRA_CONFIG_SCOPES = {
  IDC_SCOPE: 'idcs',
  CLUSTER_SCOPE: 'clusters',
};
export const INFRA_CONFIG_PROTOCOLS = {
  FX_DATABASE_SETTINGS: {
    mysql: {
      label: 'MySQL',
      codeName: 'MySql',
      rawUrlFormat: 'mysql://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'mysql://username:password@127.0.0.1:3306/db_name?charset=utf8mb4',
    },
    pgsql: {
      label: 'PostgreSQL',
      codeName: 'PgSql',
      rawUrlFormat: 'pgsql://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'pgsql://username:password@127.0.0.1:5432/db_name',
    },
  },
  FX_REDIS_SETTINGS: {
    redis: {
      label: 'Redis',
      codeName: 'Redis',
      rawUrlFormat: 'redis://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'redis://username:password@127.0.0.1:6379/1',
    },
  },
  FX_AMQP_SETTINGS: {
    amqp: {
      label: 'AMQP (RMQ)',
      codeName: 'Amqp',
      rawUrlFormat: 'amqp://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'amqp://username:password@127.0.0.1:5672/my_vhost',
    },
  },
  FX_ES_SETTINGS: {
    http: {
      label: 'Elasticsearch (HTTP)',
      codeName: 'EsHttp',
      rawUrlFormat: 'http://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'http://username:password@127.0.0.1:9200',
    },
    transport: {
      label: 'Elasticsearch (Transport)',
      codeName: 'EsTransport',
      rawUrlFormat: 'transport://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'transport://username:password@127.0.0.1:9300',
    },
  },
  FX_OSS_SETTINGS: {
    http: {
      label: 'OSS(HTTP)',
      codeName: 'Oss',
      rawUrlFormat: 'http://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'http://username:password@127.0.0.1',
    },
  },
  FX_KAFKA_SETTINGS: {
    kafka: {
      label: 'Kafka',
      codeName: 'Kafka',
      rawUrlFormat: 'kafka://[user[:[password]]@]target[:port][/schema][?attribute1=value1&attribute2=value2...]',
      rawUrlExample: 'kafka://username:password@127.0.0.1:9092',
    },
  },
};

export const INFRA_CONFIG_DASHBOARD_URLS = {
  FX_AMQP_SETTINGS: () => AMQP_DASHBOARD_URL,
  FX_ES_SETTINGS: () => ES_DASHBOARD_URL,
};

export const INFRA_TYPE_DISPLAY_ORDER = {
  FX_DATABASE_SETTINGS: 10,
  FX_REDIS_SETTINGS: 20,
  FX_AMQP_SETTINGS: 30,
  FX_ES_SETTINGS: 40,
  FX_OSS_SETTINGS: 50,
  FX_KAFKA_SETTINGS: 60,
  mysql: 11,
  pgsql: 12,
};

export const INFRA_TYPE_ICON_NAME = {
  mysql: 'icon-mysql',
  pgsql: 'icon-postgres',
  FX_DATABASE_SETTINGS: 'icon-database',
  FX_REDIS_SETTINGS: 'icon-redis',
  FX_AMQP_SETTINGS: 'icon-database-alt',
  FX_ES_SETTINGS: 'icon-database-alt2',
  FX_OSS_SETTINGS: 'icon-aws',
  FX_KAFKA_SETTINGS: 'icon-database-alt',
};

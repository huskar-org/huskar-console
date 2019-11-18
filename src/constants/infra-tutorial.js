// Installation

const JAVA_INSTALLATION_EXAMPLE_MAVEN = version => (`
// TOOD (${version})
`).trim();

const JAVA_INSTALLATION_EXAMPLE_GRADLE = version => (`
// TOOD (${version})
`).trim();

const PYTHON_INSTALLATION_EXAMPLE_PIP = version => (`
// TOOD (${version})
`).trim();

const GO_INSTALLATION_EXAMPLE_XXX = (`
// TODO
`).trim();

const SHELL_INSTALLATION_EXAMPLE_SSH = (`
# TODO
`).trim();

const SHELL_INSTALLATION_EXAMPLE_DATABASE = (`
yum install mysql         # MySQL CLI client
yum install postgresql    # PostgreSQL CLI client
`).trim();

const SHELL_INSTALLATION_EXAMPLE_REDIS = (`
yum install redis
`).trim();

const SHELL_INSTALLATION_EXAMPLE_AMQP = (`
pip install --user 'ipython<6' 'pika'
ipython
`).trim();

// Usage

const JAVA_USAGE_EXAMPLE_DATABASE = name => (`
// TODO (${name})
`).trim();

const JAVA_USAGE_EXAMPLE_REDIS = name => (`
// TODO (${name})
`).trim();

const JAVA_USAGE_EXAMPLE_AMQP = name => (`
// TODO (${name})
`).trim();

const JAVA_USAGE_EXAMPLE_ES = name => (`
// TODO (${name})
`).trim();

const JAVA_USAGE_EXAMPLE_OSS = name => (`
// TODO (${name})
`).trim();

const PYTHON_USAGE_EXAMPLE_DATABASE = name => (`
// TODO (${name})
`).trim();

const PYTHON_USAGE_EXAMPLE_REDIS = name => (`
// TODO (${name})
`).trim();

const PYTHON_USAGE_EXAMPLE_AMQP = name => (`
// TODO (${name})
`).trim();

const PYTHON_USAGE_EXAMPLE_ES = name => (`
// TODO (${name})
`).trim();

const PYTHON_USAGE_EXAMPLE_OSS = name => (`
// TODO (${name})
`).trim();

const GO_USAGE_EXAMPLE_DATABASE = name => (`
// TODO (${name})
`).trim();

const GO_USAGE_EXAMPLE_REDIS = name => (`
// TODO (${name})
`).trim();

const GO_USAGE_EXAMPLE_AMQP = name => (`
// TODO (${name})
`).trim();

const GO_USAGE_EXAMPLE_ES = name => (`
// TODO (${name})
`).trim();

const GO_USAGE_EXAMPLE_OSS = name => (`
// TODO (${name})
`).trim();

const SIDECAR_FRONTEND_PORT_COMMENT = (`
# TODO
`).trim();

// Map

export const LANGUAGE_MAP = {
  PYTHON: { highlight: 'python', label: 'Python', icon: 'python', isSDK: true },
  JAVA: { highlight: 'java', label: 'Java', icon: 'java', isSDK: true },
  GO: { highlight: 'go', label: 'Go', icon: 'go', isSDK: true },
  SHELL: { highlight: 'bash', label: 'Shell', icon: 'shell', isSDK: false },
};

export const INSTALLATION_EXAMPLE_MAP = (javaVersion, pythonVersion) => ({
  JAVA: {
    toolchains: [
      { toolchain: 'Maven', code: JAVA_INSTALLATION_EXAMPLE_MAVEN(javaVersion), highlight: 'markup' },
      { toolchain: 'Gradle', code: JAVA_INSTALLATION_EXAMPLE_GRADLE(javaVersion), highlight: 'groovy' },
    ],
    docs: 'https://example.com/nameservice.html',
  },
  PYTHON: {
    toolchains: [
      { toolchain: 'pip', code: PYTHON_INSTALLATION_EXAMPLE_PIP(pythonVersion), highlight: 'bash' },
    ],
    docs: 'https://example.com/nameservice.html',
  },
  GO: {
    toolchains: [
      { toolchain: 'xxx', code: GO_INSTALLATION_EXAMPLE_XXX, highlight: 'bash' },
    ],
    docs: 'https://example.com/nameservice.html',
  },
  SHELL: {
    toolchains: [
      { toolchain: 'ssh', code: SHELL_INSTALLATION_EXAMPLE_SSH, highlight: 'bash', skipForRawUrl: true },
      { toolchain: 'command line client', code: SHELL_INSTALLATION_EXAMPLE_DATABASE, highlight: 'bash', onlyForInfraType: 'FX_DATABASE_SETTINGS' },
      { toolchain: 'command line client', code: SHELL_INSTALLATION_EXAMPLE_REDIS, highlight: 'bash', onlyForInfraType: 'FX_REDIS_SETTINGS' },
      { toolchain: 'command line client', code: SHELL_INSTALLATION_EXAMPLE_AMQP, highlight: 'bash', onlyForInfraType: 'FX_AMQP_SETTINGS' },
    ],
  },
});

export const USAGE_EXAMPLE_MAP = {
  JAVA: {
    FX_DATABASE_SETTINGS: name => JAVA_USAGE_EXAMPLE_DATABASE(name),
    FX_REDIS_SETTINGS: name => JAVA_USAGE_EXAMPLE_REDIS(name),
    FX_AMQP_SETTINGS: name => JAVA_USAGE_EXAMPLE_AMQP(name),
    FX_ES_SETTINGS: name => JAVA_USAGE_EXAMPLE_ES(name),
    FX_OSS_SETTINGS: name => JAVA_USAGE_EXAMPLE_OSS(name),
    FX_KAFKA_SETTINGS: () => 'todo',
  },
  PYTHON: {
    FX_DATABASE_SETTINGS: name => PYTHON_USAGE_EXAMPLE_DATABASE(name),
    FX_REDIS_SETTINGS: name => PYTHON_USAGE_EXAMPLE_REDIS(name),
    FX_AMQP_SETTINGS: name => PYTHON_USAGE_EXAMPLE_AMQP(name),
    FX_ES_SETTINGS: name => PYTHON_USAGE_EXAMPLE_ES(name),
    FX_OSS_SETTINGS: name => PYTHON_USAGE_EXAMPLE_OSS(name),
    FX_KAFKA_SETTINGS: () => 'todo',
  },
  GO: {
    FX_DATABASE_SETTINGS: name => GO_USAGE_EXAMPLE_DATABASE(name),
    FX_REDIS_SETTINGS: name => GO_USAGE_EXAMPLE_REDIS(name),
    FX_AMQP_SETTINGS: name => GO_USAGE_EXAMPLE_AMQP(name),
    FX_ES_SETTINGS: name => GO_USAGE_EXAMPLE_ES(name),
    FX_OSS_SETTINGS: name => GO_USAGE_EXAMPLE_OSS(name),
    FX_KAFKA_SETTINGS: () => 'todo',
  },
  SHELL: {
    FX_DATABASE_SETTINGS: (name, valueUrlMap) => {
      const {
        isRawUrl,
        infraProtocol,
        hostname,
        username,
        password,
        port,
        dbName,
      } = valueUrlMap.master || valueUrlMap.slave || {};
      const isPostgres = infraProtocol === 'pgsql';
      const defaultPort = isPostgres ? '5432' : '3306';
      const optAuth = isPostgres
        ? `-U ${username || 'postgres'} ${password ? '-W' : '-w'}`
        : `-u ${username || 'root'}${password ? ' -p' : ''}`;
      const optHost = isRawUrl
        ? `-h ${hostname} ${isPostgres ? '-p' : '-P'} ${port || defaultPort}`
        : `-h 127.0.0.1 ${isPostgres ? '-p' : '-P'} {port}`;
      return [
        !isRawUrl && SIDECAR_FRONTEND_PORT_COMMENT,
        password && `# Password: ${password}`,
        `${isPostgres ? 'psql' : 'mysql'} ${optAuth} ${optHost} ${dbName}`,
      ].filter(x => x).join('\n');
    },
    FX_REDIS_SETTINGS: (name, valueUrlMap) => {
      const {
        isRawUrl,
        hostname,
        port,
      } = valueUrlMap.url || {};
      return [
        !isRawUrl && SIDECAR_FRONTEND_PORT_COMMENT,
        isRawUrl
          ? `redis-cli -h ${hostname || '127.0.0.1'} -p ${port || 6379}`
          : 'redis-cli -h 127.0.0.1 -p {port}',
      ].filter(x => x).join('\n');
    },
    FX_AMQP_SETTINGS: (name, valueUrlMap) => {
      const {
        isRawUrl,
        hostname,
        username,
        password,
        port,
        vHost,
      } = valueUrlMap.url || {};
      const paramHost = isRawUrl
        ? `'${hostname}', ${port || 5672}`
        : '\'127.0.0.1\', {port}';
      const paramAuth = `'${username || 'guest'}', '${password || 'guest'}'`;
      return [
        '# https://www.rabbitmq.com/tutorials/tutorial-one-python.html',
        !isRawUrl && SIDECAR_FRONTEND_PORT_COMMENT,
        'connection = pika.BlockingConnection(pika.ConnectionParameters(',
        `  ${paramHost}, '${vHost}',`,
        `  pika.PlainCredentials(${paramAuth})`,
        '))',
        'channel = connection.channel()',
      ].filter(x => x).join('\n');
    },
    FX_ES_SETTINGS: (name, valueUrlMap) => {
      const {
        isRawUrl,
        infraProtocol,
        hostname,
        port,
      } = valueUrlMap.url || {};
      if (infraProtocol === 'transport') {
        return [
          '# There is no way to talk to Elasticsearch in transport protocol.',
          '# You may want to use the HTTP protocol of Elasticsearch instead.',
        ].join('\n');
      }
      return [
        !isRawUrl && SIDECAR_FRONTEND_PORT_COMMENT,
        isRawUrl
          ? `curl http://${hostname}:${port || 9200}`
          : 'curl http://127.0.0.1:{port}',
      ].filter(x => x).join('\n');
    },
    FX_OSS_SETTINGS: () => ([
      SIDECAR_FRONTEND_PORT_COMMENT,
      'curl http://127.0.0.1:{port}',
    ].filter(x => x).join('\n')
    ),
    FX_KAFKA_SETTINGS: () => ([
      SIDECAR_FRONTEND_PORT_COMMENT,
      'kafkactl --brokers=127.0.0.1:{port}',
    ].filter(x => x).join('\n')
    ),
  },
};

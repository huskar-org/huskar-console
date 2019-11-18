import { InfraConfigItem } from '../infra-config';

describe('test url include special string', () => {
  const dataList = [
    {
      infraType: 'FX_DATABASE_SETTINGS',
      value: {
        master: 'sam+mysql://use:pass@test.name/overall.altb/db2',
        slave: 'sam+mysql://use:pass@test.name/overall.altb/db2',
      },
      urlMap: {
        master: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          dbName: 'db2',
          hostname: null,
          infraProtocol: 'mysql',
          isRawUrl: false,
          port: null,
          url: 'sam+mysql://use:pass@test.name/overall.altb/db2',
          username: 'use',
          password: 'pass',
        },
        slave: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          dbName: 'db2',
          hostname: null,
          infraProtocol: 'mysql',
          isRawUrl: false,
          port: null,
          url: 'sam+mysql://use:pass@test.name/overall.altb/db2',
          username: 'use',
          password: 'pass',
        },
      },
    },
    {
      infraType: 'FX_DATABASE_SETTINGS',
      value: {
        master: 'mysql://use:pass@test.name/overall.altb/db2',
        slave: 'mysql://use:pass@test.name/overall.altb/db2',
      },
      urlMap: {
        master: {
          applicationName: '',
          clusterName: '',
          dbName: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'mysql',
          isRawUrl: true,
          port: '',
          url: 'mysql://use:pass@test.name/overall.altb/db2',
          username: 'use',
          password: 'pass',
        },
        slave: {
          applicationName: '',
          clusterName: '',
          dbName: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'mysql',
          isRawUrl: true,
          port: '',
          url: 'mysql://use:pass@test.name/overall.altb/db2',
          username: 'use',
          password: 'pass',
        },
      },
    },
    {
      infraType: 'FX_DATABASE_SETTINGS',
      value: {
        master: 'sam+mysql://u#@s#e:@p#a@s:s@test.name/overall.altb/db2',
        slave: 'sam+mysql://u#@s#e:@p#a@s:s@test.name/overall.altb/db2',
      },
      urlMap: {
        master: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          dbName: 'db2',
          hostname: null,
          infraProtocol: 'mysql',
          isRawUrl: false,
          port: null,
          url: 'sam+mysql://u#@s#e:@p#a@s:s@test.name/overall.altb/db2',
          username: 'u#@s#e',
          password: '@p#a@s:s',
        },
        slave: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          dbName: 'db2',
          hostname: null,
          infraProtocol: 'mysql',
          isRawUrl: false,
          port: null,
          url: 'sam+mysql://u#@s#e:@p#a@s:s@test.name/overall.altb/db2',
          username: 'u#@s#e',
          password: '@p#a@s:s',
        },
      },
    },
    {
      infraType: 'FX_DATABASE_SETTINGS',
      value: {
        master: 'mysql://u#@se:@p#a@s:s@test.name/overall.altb/db2',
        slave: 'mysql://u#@se:@p#a@s:s@test.name/overall.altb/db2',
      },
      urlMap: {
        master: {
          applicationName: '',
          clusterName: '',
          dbName: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'mysql',
          isRawUrl: true,
          port: '',
          url: 'mysql://u#@se:@p#a@s:s@test.name/overall.altb/db2',
          username: 'u#@se',
          password: '@p#a@s:s',
        },
        slave: {
          applicationName: '',
          clusterName: '',
          dbName: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'mysql',
          isRawUrl: true,
          port: '',
          url: 'mysql://u#@se:@p#a@s:s@test.name/overall.altb/db2',
          username: 'u#@se',
          password: '@p#a@s:s',
        },
      },
    },
    {
      infraType: 'FX_AMQP_SETTINGS',
      value: {
        url: 'sam+amqp://use:pass@test.name/overall.altb/vhost2',
      },
      urlMap: {
        url: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          vHost: 'vhost2',
          hostname: null,
          infraProtocol: 'amqp',
          isRawUrl: false,
          port: null,
          url: 'sam+amqp://use:pass@test.name/overall.altb/vhost2',
          username: 'use',
          password: 'pass',
        },
      },
    },
    {
      infraType: 'FX_AMQP_SETTINGS',
      value: {
        url: 'amqp://use:pass@test.name/overall.altb/vhost2',
      },
      urlMap: {
        url: {
          applicationName: '',
          clusterName: '',
          vHost: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'amqp',
          isRawUrl: true,
          port: '',
          url: 'amqp://use:pass@test.name/overall.altb/vhost2',
          username: 'use',
          password: 'pass',
        },
      },
    },
    {
      infraType: 'FX_AMQP_SETTINGS',
      value: {
        url: 'sam+amqp://u#@se:@p#a@s:s@test.name/overall.altb/vhost2',
      },
      urlMap: {
        url: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          vHost: 'vhost2',
          hostname: null,
          infraProtocol: 'amqp',
          isRawUrl: false,
          port: null,
          url: 'sam+amqp://u#@se:@p#a@s:s@test.name/overall.altb/vhost2',
          username: 'u#@se',
          password: '@p#a@s:s',
        },
      },
    },
    {
      infraType: 'FX_AMQP_SETTINGS',
      value: {
        url: 'amqp://u#@se:@p#a@s:s@test.name/overall.altb/vhost2',
      },
      urlMap: {
        url: {
          applicationName: '',
          clusterName: '',
          vHost: 'overall.altb',
          hostname: 'test.name',
          infraProtocol: 'amqp',
          isRawUrl: true,
          port: '',
          url: 'amqp://u#@se:@p#a@s:s@test.name/overall.altb/vhost2',
          username: 'u#@se',
          password: '@p#a@s:s',
        },
      },
    },
    {
      infraType: 'FX_REDIS_SETTINGS',
      value: {
        url: 'sam+redis://test.name/overall.altb',
      },
      urlMap: {
        url: {
          applicationName: 'test.name',
          clusterName: 'overall.altb',
          infraProtocol: 'redis',
          isRawUrl: false,
          url: 'sam+redis://test.name/overall.altb',
        },
      },
    },
    {
      infraType: 'FX_REDIS_SETTINGS',
      value: {
        url: 'redis://test.name/overall.altb',
      },
      urlMap: {
        url: {
          applicationName: '',
          clusterName: '',
          infraProtocol: 'redis',
          isRawUrl: true,
          url: 'redis://test.name/overall.altb',
        },
      },
    },
  ];

  it('should pass getUrlMap', () => {
    dataList.forEach((data) => {
      const config = new InfraConfigItem('overall', 'default', data.infraType, 'test.name', data.value);
      expect(config.getUrlMap()).toEqual(data.urlMap);
    });
  });
});

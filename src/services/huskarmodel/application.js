import event from 'eventdecorator';
import _ from 'lodash';
import { camelCase, snakeCase } from 'change-case';
import api from 'services/api';
import Cache from './cache';
import Config from './config';
import Switch from './switch';
import Service from './service';

function itemCompare(lhs, rhs) {
  let order;

  // Sorts by cluster linking
  const lhsEmpty = !lhs.clusterPhysicalName;
  const rhsEmpty = !rhs.clusterPhysicalName;
  if (lhsEmpty !== rhsEmpty) {
    return lhsEmpty ? 1 : -1;
  }

  // Sorts by cluster name
  order = lhs.cluster.localeCompare(rhs.cluster);
  if (order !== 0) {
    return order;
  }

  // Sorts by item key
  order = lhs.key.localeCompare(rhs.key);
  return order;
}

function buildResponseError(response) {
  return new Error(
    response.data ? JSON.stringify(response.data) : 'Unknown error',
  );
}

class Application extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Application ${this.name}]`;
  }

  get teamName() {
    return this.team;
  }

  async getClusterList(type) {
    if (!(type === 'service' || type === 'switch' || type === 'config')) {
      throw new Error('type should be service, switch or config');
    }
    const response = await api[type](this.name).get();
    if (response.status < 400) {
      return response.data.data;
    }
    throw buildResponseError(response);
  }

  async deleteCluster(type, clusterName) {
    if (!(type === 'service' || type === 'switch' || type === 'config')) {
      throw new Error('type should be service, switch or config');
    }
    const response = await api[type](this.name).delete({ cluster: clusterName });
    if (response.status > 400) {
      throw buildResponseError(response);
    }
  }

  async getServiceLink(clusterName) {
    const response = await api.servicelink(this.name)(clusterName).get();
    if (response.status < 400) {
      const clusterPhysicalName = response.data.data;
      return { clusterName, clusterPhysicalName };
    }
    throw buildResponseError(response);
  }

  async getServiceRoute(clusterName) {
    const response = await api.serviceroute(this.name)(clusterName).get();
    if (response.status < 400) {
      return response.data.data.route;
    }
    throw buildResponseError(response);
  }

  async putServiceRoute(clusterName, destApplicationName, destClusterName, intent) {
    const url = api.serviceroute(this.name)(clusterName)(destApplicationName);
    const response = await url.put({ cluster_name: destClusterName, intent });
    if (response.status >= 400) {
      throw buildResponseError(response);
    }
  }

  async deleteServiceRoute(clusterName, destApplicationName, intent) {
    const url = api.serviceroute(this.name)(clusterName)(destApplicationName);
    const response = await url.delete({ intent });
    if (response.status >= 400) {
      throw buildResponseError(response);
    }
  }

  async getServiceDefaultRoute() {
    const response = await api.serviceroute.default(this.name).get();
    if (response >= 400) {
      throw buildResponseError(response);
    }
    // * default_route
    // * global_default_route
    return response.data.data;
  }

  async putServiceDefaultRoute(clusterName, ezone, intent) {
    const response = await api.serviceroute.default(this.name)
      .put({ ezone, intent, cluster_name: clusterName });
    if (response.status >= 400) {
      throw buildResponseError(response);
    }
    return response.data.data;
  }

  async deleteServiceDefaultRoute(ezone, intent) {
    const response = await api.serviceroute.default(this.name).delete({ ezone, intent });
    if (response.status >= 400) {
      throw buildResponseError(response);
    }
    return response.data.data;
  }

  async getClusterConfig(key, clusterName) {
    const list = await this.getConfigList();
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].key === key && list[i].cluster === clusterName) {
        return list[i];
      }
    }
    throw new Error(`Config "${clusterName}/${key}" not found.`);
  }

  async getClusterSwitch(key, clusterName) {
    const list = await this.getSwitchList();
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].key === key && list[i].cluster === clusterName) {
        return list[i];
      }
    }
    throw new Error(`Switch "${clusterName}/${key}" not found.`);
  }

  async createConfig(clusterName, { key, value, comment }) {
    const data = { key, value, comment };
    const response = await api.config(this.name)(clusterName).post(data);
    if (response.status < 400) {
      this.removeCache('configList');
      this.trigger('configListChange');
    }
    return response;
  }

  async createSwitch(clusterName, { key, value, comment }) {
    const data = { key, value, comment };
    const response = await api.switch(this.name)(clusterName).post(data);
    if (response.status < 400) {
      this.removeCache('switchList');
      this.trigger('switchListChange');
    }
    return response;
  }

  async createService(data) {
    const response = await api.service(this.name)(data.clusterName).post(data);
    if (response.status < 400) {
      this.removeCache('serviceList');
      this.trigger('serviceListChange');
    }
    return response;
  }

  async createCluster(cluster) {
    const response = api.service(this.name).post({ cluster });
    if (response.status < 400) {
      this.removeCache('serviceList');
      this.trigger('serviceListChange');
    }
    return response;
  }

  async exportList(dataType, dataProcessor) {
    const response = await api[`batch_${dataType}`].get({
      application: this.name,
      format: 'file',
      t: +(new Date()), // no-cache
    });
    if (response.status < 400) {
      const processor = dataProcessor || (x => x);
      const text = processor(response.xhr.responseText);
      const type = 'application/octet-stream';
      return new Blob([text], { type });
    }
    throw buildResponseError(response);
  }

  async importList(dataType, text) {
    const type = 'application/octet-stream';
    const data = new FormData();
    data.append('import_file', new Blob([text], { type }));

    const response = await api[`batch_${dataType}`].post(data);
    if (response.status < 400) {
      this.removeCache(`${dataType}List`);
      this.trigger(`${dataType}ListChange`);
    }
    return response;
  }

  getConfigList() {
    return this.cache('configList', async () => {
      const response = await api.batch_config.get({ application: this.name });
      if (response.status < 400) {
        return response.data.data
          .map(raw => new Config(raw, this))
          .sort(itemCompare);
      }
      throw buildResponseError(response);
    });
  }

  getSwitchList() {
    return this.cache('switchList', async () => {
      const response = await api.batch_switch.get({ application: this.name });
      if (response.status < 400) {
        return response.data.data
          .map(raw => new Switch(raw, this))
          .sort(itemCompare);
      }
      throw buildResponseError(response);
    });
  }

  getServiceList() {
    return this.cache('serviceList', async () => {
      const clusterList = await this.getClusterList('service');
      const instanceList = await Promise.all(clusterList
        .filter(c => c.meta.instance_count === undefined || c.meta.instance_count > 0)
        .map(c => api.service(this.name)(c.name).get()));
      const error = instanceList.find(response => response.status >= 400);
      if (error) {
        throw buildResponseError(error);
      }
      return instanceList
        .map(response => response.data.data)
        .reduce((a, b) => a.concat(b), [])
        .map(raw => new Service(raw, this))
        .sort(itemCompare);
    });
  }

  getRoleList() {
    return this.cache('roleList', async () => {
      const response = await api.auth.application(this.name).get();
      if (response.status < 400) {
        const { data } = response.data;
        const authList = data.application_auth
          .map(item => ({
            authority: item.authority,
            user: _.mapKeys(item.user, (v, k) => camelCase(k)),
            username: item.user.username, // For filter compatible
          }))
          .filter(item => item.user.username !== this.name)
          .filter(item => item.user.isActive);
        return _.sortBy(authList, [
          (o => o.user.isApplication),
          (o => o.user.username),
          (o => o.authority),
        ]);
      }
      throw buildResponseError(response);
    });
  }

  async addRole(data) {
    const response = await api.auth.application(this.name).post(data);
    if (response.status < 400) {
      this.removeCache('roleList');
      this.trigger('change');
      this.trigger('roleListChange');
    }
    return response;
  }

  async removeRole(authority, username) {
    const data = { authority, username };
    const response = await api.auth.application(this.name).delete(data);
    if (response.status < 400) {
      this.removeCache('roleList');
      this.trigger('change');
      this.trigger('roleListChange');
    }
  }

  async remove() {
    const response = await api.application(this.name).delete();
    if (response.status < 400) {
      this.parent.removeCache('applicationList');
      this.parent.trigger('change');
      this.parent.trigger('applicationListChange');
    }
    return response;
  }

  async getServiceInfo(clusterName) {
    let query = api.serviceinfo(this.name);
    if (clusterName) {
      query = query(clusterName);
    }
    const response = await query.get();
    if (response.status < 400) {
      const data = {};
      Object.keys(response.data.data).forEach((key) => {
        data[camelCase(key)] = response.data.data[key];
      });
      return data;
    }
    if (response.status === 404) {
      throw new Error('This function is not available now.');
    }
    throw buildResponseError(response);
  }

  async putServiceInfo(clusterName, data) {
    const requestData = {};
    Object.keys(data).forEach((key) => {
      requestData[snakeCase(key)] = data[key];
    });

    let query = api.serviceinfo(this.name);
    if (clusterName) {
      query = query(clusterName);
    }
    const response = await query.patch(JSON.stringify(requestData));
    if (response.status < 400) {
      return response.data;
    }
    if (response.status === 404) {
      throw new Error('This function is not available now.');
    }
    throw buildResponseError(response);
  }

  async deleteServiceInfo(clusterName) {
    let query = api.serviceinfo(this.name);
    if (clusterName) {
      query = query(clusterName);
    }
    const response = await query.delete();
    if (response.status < 400) {
      return response.data;
    }
    if (response.status === 404) {
      throw new Error('This function is not available now.');
    }
    throw buildResponseError(response);
  }
}

export default event(Application);

import event from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';

class Service extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Service ${this.name}]`;
  }

  async remove() {
    const response = await api
      .service(this.applicationName)(this.clusterName)
      .delete({ key: this.key });
    if (response.status < 400) {
      this.parent.removeCache('serviceList');
      this.parent.trigger('serviceListChange');
      this.parent.trigger('change');
    }
  }

  async setData({ key, value }) {
    const data = { key, value };
    const response = await api
      .service(this.applicationName)(this.clusterName)
      .put(data);
    if (response.status < 400) {
      Object.assign(this, data);
      this.parent.trigger('change');
    }
    return response;
  }

  parseValue() {
    const result = { isBroken: false };
    try {
      Object.assign(result, JSON.parse(this.value));
      Object.assign(result, JSON.parse(this.runtime));
    } catch (e) {
      result.isBroken = true;
    }
    return result;
  }

  get teamName() {
    return this.parent.teamName;
  }

  get applicationName() {
    return this.parent.name;
  }

  get clusterName() {
    return this.cluster;
  }

  get clusterPhysicalName() {
    return this.cluster_physical_name || null;
  }
}

export default event(Service);

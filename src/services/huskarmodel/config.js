import event from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';

class Config extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Config ${this.name}]`;
  }

  async remove() {
    const response = await api
      .config(this.applicationName)(this.clusterName)
      .delete({ key: this.key });
    if (response.status < 400) {
      this.parent.removeCache('configList');
      this.parent.trigger('configListChange');
      this.parent.trigger('change');
    }
  }

  async setData({ key, value, comment }) {
    const data = { key, value, comment };
    const response = await api
      .config(this.applicationName)(this.clusterName)
      .put(data);
    if (response.status < 400) {
      Object.assign(this, data);
      this.parent.trigger('change');
    }
    return response;
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
}

export default event(Config);

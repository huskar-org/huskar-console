import event from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';

class Switch extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Switch ${this.name}]`;
  }

  async remove() {
    const response = await api
      .switch(this.applicationName)(this.clusterName)
      .delete({ key: this.key });
    if (response.status < 400) {
      this.parent.removeCache('switchList');
      this.parent.trigger('switchListChange');
      this.parent.trigger('change');
    }
  }

  async setData({ key, value, comment }) {
    const data = { key, value, comment };
    const response = await api
      .switch(this.applicationName)(this.clusterName)
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

  get isStringValue() {
    return this.value && Number.isNaN(+this.value);
  }
}

export default event(Switch);

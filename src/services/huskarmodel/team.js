import eventdecorator from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';
import Application from './application';
import Privilege from './privilege';

class Team extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Team ${this.name}]`;
  }

  async getApplication(name) {
    const list = await this.getApplicationList();
    const found = list.find(x => x.name === name);
    if (typeof found !== 'undefined') {
      return found;
    }
    throw new Error(`Application "${name}" not found.`);
  }

  async getApplicationList() {
    return this.cache('applicationList', async () => {
      const response = await api.team(this.name).get();
      const { data } = response.data;
      const result = data.applications.map(raw => new Application({ name: raw }, this));
      return result;
    });
  }

  async createApplication(data) {
    const response = await api.application.post({ application: data.name, team: this.name });
    if (response.status < 400) {
      this.removeCache('applicationList');
      this.trigger('change');
      this.trigger('applicationListChange');
    }
    return response;
  }

  async getPrivilegeList() {
    return this.cache('privilegeList', async () => {
      const response = await api.auth.team(this.name).get();
      let { data } = response.data;
      data = Object.keys(data).map(
        privilege => data[privilege].map(
          username => new Privilege({ privilege, username }, this),
        ),
      );
      return [].concat(...data);
    });
  }

  async remove() {
    const response = await api.team(this.name).delete();
    if (response.status < 400) {
      this.parent.removeCache('teamList');
      this.parent.trigger('change');
      this.parent.trigger('teamListChange');
    }
    return response;
  }

  async createPrivilege(data) {
    const response = await api.auth.team(this.name).post(data);
    if (response.status < 400) {
      this.removeCache('privilegeList');
      this.trigger('privilegeListChange');
      this.trigger('change');
    }
    return response;
  }
}

export default eventdecorator(Team);

import eventdecorator from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';
import Application from './application';
import Team from './team';
import User from './user';

class HuskarModel extends Cache {
  async getTeam(name) {
    const list = await this.getTeamList();
    const found = list.find(x => x.name === name);
    if (typeof found !== 'undefined') {
      return found;
    }
    throw new Error(`Team "${name}" not found.`);
  }

  async getTeamList() {
    return this.cache('teamList', async () => {
      const response = await api.team.get();
      const data = [...response.data.data.teams];
      return data.map(raw => new Team(raw, this));
    });
  }

  async addTeam(data) {
    const response = await api.team.post({ team: data.name });
    if (response.status < 400) {
      this.removeCache('teamList');
      this.trigger('change');
      this.trigger('teamListChange');
    }
    return response;
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
      const response = await api.application.get();
      const data = [...response.data.data];
      return data.map(raw => new Application(raw, this));
    });
  }

  async getUserList() {
    return this.cache('userList', async () => {
      const response = await api.user.get();
      const data = [...response.data.data];
      return data.map(raw => new User(raw, this));
    });
  }

  async addUser(data) {
    const response = await api.user.post(data);
    if (response.status < 400) {
      this.removeCache('userList');
      this.trigger('change');
      this.trigger('userListChange');
    }
    return response;
  }
}

const HuskarModelWithEvent = eventdecorator(HuskarModel);
export default new HuskarModelWithEvent();

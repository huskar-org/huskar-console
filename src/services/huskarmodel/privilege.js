import event from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';

class Privilege extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
  }

  toString() {
    return `[Privilege ${this.name}]`;
  }

  async remove() {
    const response = await api
      .auth.team(this.teamName)
      .delete({ username: this.username });
    if (response.status < 400) {
      this.parent.removeCache('privilegeList');
      this.parent.trigger('privilegeListChange');
      this.parent.trigger('change');
    }
    return response;
  }

  get teamName() {
    return this.parent.name;
  }
}

export default event(Privilege);

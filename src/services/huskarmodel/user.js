import eventdecorator from 'eventdecorator';
import api from 'services/api';
import Cache from './cache';

function formatDate(value) {
  const date = new Date(Date.parse(value));
  const text = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return text.replace(/\b\d\b/g, '0$&');
}

class User extends Cache {
  constructor(raw, parent) {
    super();
    this.parent = parent;
    this.on('change', () => parent.trigger('change'));
    Object.assign(this, raw);
    this.creationDate = formatDate(this.created_at);
  }

  async remove() {
    const response = await api.user(this.username).delete();
    if (response.status < 400) {
      this.parent.removeCache('userList');
      this.parent.trigger('userListChange');
      this.parent.trigger('change');
    }
    return response;
  }

  toggleHuskarAdmin() {
    if (this.huskar_admin) {
      return this.downgradeToHuskarAdmin();
    }
    return this.upgradeToHuskarAdmin();
  }

  async upgradeToHuskarAdmin() {
    const response = await api.auth.huskar.post({ username: this.username });
    if (response.status < 400) {
      this.huskar_admin = true;
      this.parent.trigger('change');
    }
    return response;
  }

  async downgradeToHuskarAdmin() {
    const response = await api.auth.huskar(this.username).delete();
    if (response.status < 400) {
      this.huskar_admin = false;
      this.parent.trigger('change');
    }
    return response;
  }

  toString() { return `[User ${this.name}]`; }
}

export default eventdecorator(User);

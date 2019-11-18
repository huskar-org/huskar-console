import Immutable from 'immutable';

const ContainerIdBase = Immutable.Record({
  id: '',
});

export default class ContainerId extends ContainerIdBase {
  toString() {
    return this.id;
  }

  get isEmpty() {
    return !this.id;
  }

  static parse(containerId) {
    if (containerId instanceof ContainerId) {
      return containerId;
    }

    if (containerId.length < 32) {
      return new ContainerId();
    }

    return new ContainerId({
      id: containerId,
    });
  }
}

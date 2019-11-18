import Heap from './heap';

export default class Cache extends Heap {
  cache(key, factory) {
    return this.$$save(key, this.$$load(key) || factory());
  }

  removeCache(key) {
    return this.$$remove(key);
  }
}

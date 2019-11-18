export default class Heap {
  constructor() {
    Object.defineProperty(this, '$$heap', { value: {} });
  }

  $$save(key, data) {
    this.$$heap[key] = data;
    return data;
  }

  $$load(key) {
    return this.$$heap[key];
  }

  $$remove(key) {
    delete this.$$heap[key];
    return true;
  }
}

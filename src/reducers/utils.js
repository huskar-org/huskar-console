import _ from 'lodash';

export default function toCamelCase(obj) {
  return Object.assign({}, ...Object.entries(obj)
    .map(([key, value]) => ({ [_.camelCase(key)]: value })));
}

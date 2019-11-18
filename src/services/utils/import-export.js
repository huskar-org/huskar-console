import { isReservedConfigKey } from '../../constants/common';

export function exportProcess(text, applicationName, typeName) {
  let data = JSON.parse(text);
  data = data.map((item) => {
    const r = Object.assign({}, item);
    if (r.application === applicationName) {
      delete r.application;
    }
    return r;
  }).filter(r => !isReservedConfigKey(r.key));
  return JSON.stringify({
    version: 'v1',
    type: typeName,
    content: data,
  }, null, 2);
}

export function importProcess(text, applicationName, typeName) {
  let data = JSON.parse(text);

  // Parse versions
  if (data.version === 'v1') {
    if (data.type !== typeName) {
      throw new Error(`Expected ${typeName} but ${data.type} found`);
    }
    data = data.content;
  } else {
    throw new Error('unknown data schema');
  }

  data = data.map((item) => {
    const r = Object.assign({}, item);
    if (typeof r.application === 'undefined') {
      r.application = applicationName;
    }
    return r;
  });
  return JSON.stringify(data, null, 2);
}

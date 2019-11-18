import _ from 'lodash';
import URL from 'url-parse';
import { ENCRYPTION_PREFIX } from '../../constants/common';
import { InfraConfigTypes } from '../../structures';


export function checkIsDesensitized(actionData) {
  return (!actionData.data && !actionData.value && !actionData.nested);
}

export function getActionStringValue(rawValue) {
  return rawValue instanceof Object ? JSON.stringify(rawValue) : rawValue;
}

export function detectEncryptedData(rawValue) {
  const value = getActionStringValue(rawValue);
  return value && value.startsWith(ENCRYPTION_PREFIX);
}

const configActions = ['UPDATE_CONFIG', 'DELETE_CONFIG'];
export function checkIsConfigAction(actionName) {
  return configActions.includes(actionName);
}

/* encode username and password */
function patchUrl(url) {
  const regex = /^([\w\\+]+:\/\/)(?:([^:/]*)(?:(:)(.*))?(@))?(.*)$/;
  return url.replace(regex, (match, scheme, username, sep, password, at, extra) => {
    const parts = [scheme];
    if (username) {
      parts.push(encodeURIComponent(username));
    }
    if (sep) {
      parts.push(sep);
    }
    if (password) {
      parts.push(encodeURIComponent(password));
    }
    if (at) {
      parts.push(at);
    }
    if (extra) {
      parts.push(extra);
    }
    return parts.join('');
  });
}

function desensitizeUrl(rawUrl) {
  if (rawUrl.length > 10240) {
    return rawUrl;
  }

  const parsed = new URL(patchUrl(rawUrl));
  if (parsed.protocol === '') {
    return rawUrl;
  }

  if (parsed.username !== '') {
    parsed.set('username', decodeURIComponent(parsed.username));
  }
  if (parsed.password !== '') {
    parsed.set('password',
      _.repeat('*', parsed.password.length));
  }
  return parsed.href;
}

export function desensitizeActionDataItem(actionName, actionData, actionDataItem) {
  if (!actionDataItem) {
    return actionDataItem;
  }
  switch (actionName) {
    case 'UPDATE_INFRA_CONFIG':
    case 'DELETE_INFRA_CONFIG': {
      const urlAttrs = InfraConfigTypes.findByShortName(actionData.infraType).urlAttributes;
      const newItem = Object.assign({}, actionDataItem);
      urlAttrs.forEach((attr) => {
        newItem[attr] = desensitizeUrl(newItem[attr]);
      });
      return newItem;
    }
    default:
      return actionDataItem;
  }
}

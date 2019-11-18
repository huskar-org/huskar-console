import store from '../../store';
import * as types from '../../constants/actiontypes';
import { RELEASE_WINDOW_READ_ONLY_BYPASS } from '../../constants/common';
import { READ_ONLY_EXCLUSIVE_PATHS } from '../../constants/env';

// X-Frontend-Only: bypass
function getReadOnlyHeader(pathInfo) {
  const { releaseWindow } = store.getState();
  const headers = { 'x-frontend-read-only': releaseWindow.get('readOnly') };
  if (releaseWindow.get('bypass')) {
    headers['x-frontend-read-only'] = RELEASE_WINDOW_READ_ONLY_BYPASS;
  }
  if (pathInfo.operationApplication) {
    headers['X-Frontend-Operation-Application'] = pathInfo.operationApplication;
  }
  if (pathInfo.operationType) {
    headers['X-Frontend-Operation-Type'] = pathInfo.operationType;
  }
  if (pathInfo.operationCluster) {
    headers['X-Frontend-Operation-Cluster'] = pathInfo.operationCluster;
  }
  return headers;
}

export function setRequestHeaders(xhr, data, pathInfoParser) {
  const { url } = xhr.__request; // eslint-disable-line no-underscore-dangle
  const pathInfo = pathInfoParser(url, data);
  const readOnlyHeader = getReadOnlyHeader(pathInfo);
  const headers = Object.assign({}, readOnlyHeader);
  Object.entries(headers).forEach(([name, value]) => {
    xhr.setRequestHeader(name, value);
  });
}

export function handleResponseHeaders(method, url, xhr) {
  if (READ_ONLY_EXCLUSIVE_PATHS.every(x => !x || !url.startsWith(x))) {
    const readOnly = xhr.getResponseHeader('x-frontend-read-only');
    if (readOnly !== null) {
      store.dispatch((dispatch) => {
        dispatch({ type: types.SET_RELEASE_WINDOW_STATE, readOnly });
      });
    }
  }
}

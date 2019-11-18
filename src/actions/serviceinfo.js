import api from '../services/api';
import * as types from '../constants/actiontypes';
import { createAction } from './utils';

const getRequestAPI = (applicationName, clusterName = null) => (
  clusterName === null
    ? api.serviceinfo(applicationName)
    : api.serviceinfo(applicationName)(clusterName)
);

export function fetchServiceInfo(applicationName, clusterName = null) {
  const requestAPI = getRequestAPI(applicationName, clusterName);
  return createAction({
    request: () => requestAPI.get(),
    response: ({ data }) => ({ applicationName, clusterName, data: data.data }),
    types: [
      types.FETCH_SERVICE_INFO_BEGIN,
      types.FETCH_SERVICE_INFO_END,
    ],
  });
}

export function clearServiceInfo(applicationName, clusterName = null) {
  const requestAPI = getRequestAPI(applicationName, clusterName);
  return createAction({
    request: () => requestAPI.delete(),
    response: () => ({ applicationName, clusterName }),
    types: [
      types.CLEAR_SERVICE_INFO_BEGIN,
      types.CLEAR_SERVICE_INFO_END,
    ],
  });
}

export function putServiceInfo(applicationName, clusterName = null, requestData = {}) {
  const requestAPI = getRequestAPI(applicationName, clusterName);
  return createAction({
    request: () => requestAPI.put(JSON.stringify(requestData)),
    response: () => ({ applicationName, clusterName }),
    types: [
      types.PUT_SERVICE_INFO_BEGIN,
      types.PUT_SERVICE_INFO_END,
    ],
  });
}

export function discardServiceInfo() {
  return { type: types.DISCARD_SERVICE_INFO };
}

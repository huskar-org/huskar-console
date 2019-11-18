import _ from 'lodash';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import { createAction } from './utils';

export function batchFetchClusterInstances(type, application, clusterList) {
  return createAction({
    request: () => Promise.all(clusterList.map(cluster => api[type](application)(cluster).get({
      resolve: '0',
    }))),
    payload: { instanceType: type },
    response: (responseList) => {
      const result = _.flatten(responseList.map(({ data }) => data.data));
      return { instanceType: type, application, result };
    },
    catch: () => ({ instanceType: type }),
    types: [
      types.FETCH_INSTANCE_LIST_BEGIN,
      types.FETCH_INSTANCE_LIST_END,
    ],
  });
}

export function batchFetchInstances(type, application) {
  return createAction({
    request: () => api[`batch_${type}`].get({ application }),
    response: ({ data }) => ({ instanceType: type, application, result: data.data }),
    payload: { instanceType: type },
    catch: () => ({ instanceType: type }),
    types: [
      types.FETCH_INSTANCE_LIST_BEGIN,
      types.FETCH_INSTANCE_LIST_END,
    ],
  });
}

export function fetchApplicationInstances(type, application) {
  const clusterList = [];
  return createAction({
    request: () => api[type](application).get(),
    response: ({ data }) => {
      const clusters = data.data.map(x => x.name);
      clusterList.push(...clusters);
      return { instanceType: type, application, data: data.data };
    },
    payload: { instanceType: type },
    catch: () => ({ instanceType: type }),
    types: [
      types.FETCH_CLUSTER_LIST_BEGIN,
      types.FETCH_CLUSTER_LIST_END,
    ],
    next: (dispatch) => {
      dispatch(batchFetchClusterInstances(type, application, clusterList));
    },
  });
}

export function createInstance(
  type, application, cluster, { key, value, comment }, version,
) {
  const fetchInstanceList = type === 'service' ? fetchApplicationInstances : batchFetchInstances;
  const payload = Number.isNaN(Number.parseInt(version, 10))
    ? { key, value, comment }
    : { key, value, comment, version };
  return createAction({
    request: () => api[type](application)(cluster).put(payload),
    response: () => ({ instanceType: type }),
    payload: { instanceType: type },
    catch: () => ({ instanceType: type }),
    types: [
      types.CREATE_INSTANCE_BEGIN,
      types.CREATE_INSTANCE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchInstanceList(type, application));
    },
  });
}

export function deleteInstance(type, application, cluster, key) {
  const fetchInstanceList = type === 'service' ? fetchApplicationInstances : batchFetchInstances;
  return createAction({
    request: () => api[type](application)(cluster).delete({ key }),
    response: () => ({ instanceType: type }),
    payload: { instanceType: type },
    catch: () => ({ instanceType: type }),
    types: [
      types.DELETE_INSTANCE_BEGIN,
      types.DELETE_INSTANCE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchInstanceList(type, application));
    },
  });
}

export function updateServiceState(applicationName, clusterName, key, state, version) {
  if (state !== 'up' && state !== 'down') {
    throw Error('unexpected state in arguments');
  }
  const runtime = JSON.stringify({ state });
  const payload = { key, runtime, version };
  return createAction({
    request: () => api.service(applicationName)(clusterName).put(payload),
    response: ({ data }) => ({
      instanceType: 'service',
      value: data.data.value,
      meta: data.data.meta,
      applicationName,
      key,
    }),
    payload: { instanceType: 'service' },
    catch: () => ({ instanceType: 'service' }),
    types: [
      types.UPDATE_INSTANCE_STATE_BEGIN,
      types.UPDATE_INSTANCE_STATE_END,
    ],
  });
}

export function fetchClusterList(type, application) {
  return createAction({
    request: () => api[type](application).get(),
    response: ({ data }) => ({
      instanceType: type,
      application,
      data: data.data,
    }),
    payload: { instanceType: type },
    catch: () => ({ instanceType: type }),
    types: [
      types.FETCH_CLUSTER_LIST_BEGIN,
      types.FETCH_CLUSTER_LIST_END,
    ],
  });
}

export function createCluster(type, application, cluster) {
  if (type !== 'service') {
    return null;
  }
  return createAction({
    request: () => api.service(application).post({ cluster }),
    response: () => ({}),
    payload: { instanceType: type },
    catch: (() => ({ instanceType: type })),
    types: [
      types.CREATE_CLUSTER_BEGIN,
      types.CREATE_CLUSTER_END,
    ],
    next: fetchClusterList(type, application),
  });
}

export function deleteCluster(type, application, cluster) {
  if (['service', 'config', 'switch'].indexOf(type) === -1) {
    return null;
  }

  return createAction({
    request: () => api[type](application).delete({ cluster }),
    response: () => ({}),
    payload: { instanceType: type },
    catch: (() => ({ instanceType: type })),
    types: [
      types.DELETE_CLUSTER_BEGIN,
      types.DELETE_CLUSTER_END,
    ],
    next: fetchClusterList(type, application),
  });
}

import * as types from '../constants/actiontypes';
import api from '../services/api';
import { fetchClusterList } from './instance';
import { createAction, makePromiseChain } from './utils';

export function fetchServiceRoute(applicationName, clusterName) {
  return createAction({
    request: () => Promise.all([
      api.serviceroute(applicationName)(clusterName).get(),
      api.serviceroute.default(applicationName).get(),
    ]),
    payload: { applicationName, clusterName },
    response: ([routeResp, defaultRouteResp]) => {
      const { route } = routeResp.data.data;
      const { data: defaultRoute } = defaultRouteResp.data;
      return { applicationName, clusterName, route, defaultRoute };
    },
    types: [
      types.FETCH_SERVICE_ROUTE_BEGIN,
      types.FETCH_SERVICE_ROUTE_END,
    ],
  });
}

export function updateServiceRoute(
  fromApplicationName,
  fromClusterName,
  applicationName,
  clusterName,
  intent = 'direct',
) {
  return createAction({
    request: () => api.serviceroute(fromApplicationName)(fromClusterName)(applicationName)
      .put({
        intent,
        cluster_name: clusterName,
      }),
    response: () => ({}),
    types: [
      types.UPDATE_SERVICE_ROUTE_BEGIN,
      types.UPDATE_SERVICE_ROUTE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchClusterList('service', fromApplicationName));
      dispatch(fetchServiceRoute(fromApplicationName, fromClusterName));
    },
  });
}

export function batchUpdateServiceRoute(applicationName, clusterName, routeList) {
  return createAction({
    request: () => makePromiseChain(routeList.map(route => () => (
      api
        .serviceroute(route.from_application_name)(route.from_cluster_name)(route.application_name)
        .put({ intent: route.intent, cluster_name: route.cluster_name })
    ))),
    response: () => ({}),
    types: [
      types.UPDATE_SERVICE_ROUTE_BEGIN,
      types.UPDATE_SERVICE_ROUTE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchClusterList('service', applicationName));
      dispatch(fetchServiceRoute(applicationName, clusterName));
    },
  });
}

export function deleteServiceRoute(
  fromApplicationName,
  fromClusterName,
  applicationName,
  intent = 'direct',
) {
  return createAction({
    request: () => (
      api
        .serviceroute(fromApplicationName)(fromClusterName)(applicationName)
        .delete({ intent })
    ),
    response: () => ({
      applicationName: fromApplicationName,
      clusterName: fromClusterName,
    }),
    catch: () => ({}),
    types: [
      types.DELETE_SERVICE_ROUTE_BEGIN,
      types.DELETE_SERVICE_ROUTE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchClusterList('service', fromApplicationName));
      dispatch(fetchServiceRoute(fromApplicationName, fromClusterName));
    },
  });
}

export function updateServiceDefaultRoute(
  applicationName, clusterName, destClusterName, ezone, intent,
) {
  const clusterNameKey = 'cluster_name';
  return createAction({
    request: () => api.serviceroute.default(applicationName).put({
      ezone,
      intent,
      [clusterNameKey]: destClusterName,
    }),
    response: () => ({}),
    types: [
      types.UPDATE_SERVICE_DEFAULT_ROUTE_BEGIN,
      types.UPDATE_SERVICE_DEFAULT_ROUTE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchClusterList('service', applicationName));
      dispatch(fetchServiceRoute(applicationName, clusterName));
    },
  });
}

export function deleteServiceDefaultRoute(applicationName, clusterName, ezone, intent) {
  return createAction({
    request: () => api.serviceroute.default(applicationName).delete({
      ezone,
      intent,
    }),
    response: () => ({}),
    types: [
      types.DELETE_SERVICE_DEFAULT_ROUTE_BEGIN,
      types.DELETE_SERVICE_DEFAULT_ROUTE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchClusterList('service', applicationName));
      dispatch(fetchServiceRoute(applicationName, clusterName));
    },
  });
}

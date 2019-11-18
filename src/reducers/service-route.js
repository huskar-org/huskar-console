import Immutable from 'immutable';
import _ from 'lodash';
import { camelCase } from 'change-case';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  loading: false,
  outgoing: new Immutable.List(),
  defaultIncoming: new Immutable.Map(),
  globalDefaultIncoming: new Immutable.Map(),
});

export default function serviceRoute(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_SERVICE_ROUTE_BEGIN: {
      return state
        .set('outgoing', null)
        .set('loading', true);
    }
    case types.FETCH_SERVICE_ROUTE_END:
      return state
        .set('outgoing', new Immutable.List(action.route)
          .map(item => _.mapKeys(item, (u, k) => camelCase(k)))
          .map(item => new Immutable.Map(Object.assign({}, item, {
            fromApplicationName: action.applicationName,
            fromClusterName: action.clusterName,
          })))
          .sort()
          .map((item, idx) => item.set('id', idx)))
        .set('defaultIncoming',
          Immutable.fromJS(action.defaultRoute.default_route || {}))
        .set('globalDefaultIncoming',
          Immutable.fromJS(action.defaultRoute.global_default_route || {}))
        .set('loading', false);
    case types.UPDATE_SERVICE_ROUTE_BEGIN:
    case types.UPDATE_SERVICE_DEFAULT_ROUTE_BEGIN:
    case types.DELETE_SERVICE_ROUTE_BEGIN:
    case types.DELETE_SERVICE_DEFAULT_ROUTE_BEGIN:
      return state.set('loading', true);
    case types.UPDATE_SERVICE_ROUTE_END:
    case types.UPDATE_SERVICE_DEFAULT_ROUTE_END:
    case types.DELETE_SERVICE_ROUTE_END:
    case types.DELETE_SERVICE_DEFAULT_ROUTE_END:
      return state.set('loading', false);
    default:
      return state;
  }
}

import { combineReducers } from 'redux';
import Immutable from 'immutable';
import * as types from '../constants/actiontypes';
import toCamelCase from './utils';

const initialState = new Immutable.Map({
  isInstancesChanging: false,
  isFetching: false,
  instances: new Immutable.OrderedMap(),
  clusters: new Immutable.OrderedMap(),
  error: null,
});

const BaseInstance = defaultValues => class extends Immutable.Record({
  type: null,
  application: null,
  cluster: null,
  key: '',
  value: null,
  comment: '',
  meta: null,
  ...defaultValues,
}) {};

const InstanceMeta = new Immutable.Record({
  created: null,
  lastModified: null,
  version: null,
});

class ConfigInstance extends BaseInstance() {
  static parseFrom(data) {
    return new this(Object.assign({}, data, {
      meta: new InstanceMeta(toCamelCase(data.meta)),
    }));
  }
}

class ServiceInstance extends BaseInstance({
  runtime: null,
}) {
  static parseFrom(data) {
    return new this(Object.assign({}, data, {
      value: JSON.parse(data.value),
      runtime: JSON.parse(data.runtime),
      meta: new InstanceMeta(toCamelCase(data.meta)),
    }));
  }
}

const ClusterMeta = new Immutable.Record({
  created: null,
  instanceCount: null,
  lastModified: null,
  version: null,
});

const ClusterRoute = new Immutable.Record({
  applicationName: '',
  clusterName: '',
  intent: '',
});

export const Cluster = new Immutable.Record({
  type: null,
  application: null,
  name: '',
  meta: new ClusterMeta(),
  physicalName: null,
  route: [],
});

const instanceReducer = type => (state = initialState, action) => {
  if (
    (action.instanceType && action.instanceType !== type)
    || (action.payload && action.payload.instanceType !== type)
  ) {
    return state;
  }
  let instanceClass = ConfigInstance;

  if (type === 'service') {
    instanceClass = ServiceInstance;

    switch (action.type) {
      case types.UPDATE_INSTANCE_STATE_BEGIN:
        return state.set('isInstancesChanging', true)
          .set('error', null);
      case types.UPDATE_INSTANCE_STATE_END:
        if (action.error) {
          return state
            .set('isInstancesChanging', false)
            .set('error', action.error);
        }
        return state
          .updateIn(['instances', action.applicationName], instances => (
            instances.map(item => (
              item.key === action.key
                ? item
                  .set('value', action.value)
                  .set('meta', new InstanceMeta(toCamelCase(action.meta)))
                : item
            ))
          ))
          .set('isInstancesChanging', false)
          .set('error', null);
      default:
        // do nothing
    }
  }

  switch (action.type) {
    case types.CREATE_INSTANCE_BEGIN:
    case types.DELETE_INSTANCE_BEGIN:
      return state.set('isInstancesChanging', true)
        .set('error', null);
    case types.CREATE_INSTANCE_END:
    case types.DELETE_INSTANCE_END:
      if (action.error) {
        return state
          .set('isInstancesChanging', false)
          .set('error', action.error);
      }
      return state.set('isInstancesChanging', false);
    case types.FETCH_INSTANCE_LIST_BEGIN:
      return state.set('isFetching', true)
        .set('error', null);
    case types.FETCH_INSTANCE_LIST_END:
      if (action.error) {
        return state
          .updateIn(
            ['instances', action.application],
            items => (items || new Immutable.OrderedSet()),
          )
          .set('error', action.error)
          .set('isFetching', false);
      }
      return state
        .setIn(
          ['instances', action.application],
          action.result.map(data => instanceClass.parseFrom(
            Object.assign({ type }, data),
          )),
        )
        .set('isFetching', false);
    case types.FETCH_CLUSTER_LIST_BEGIN:
      return state.set('isFetching', true)
        .set('error', null);
    case types.FETCH_CLUSTER_LIST_END:
      if (action.error) {
        return state
          .updateIn(
            ['clusters', action.application],
            items => (items || new Immutable.OrderedSet()),
          )
          .set('isFetching', false)
          .set('error', action.error);
      }
      return state
        .setIn(
          ['clusters', action.application],
          new Immutable.OrderedSet(
            action.data.map(item => new Cluster({
              type: action.instanceType,
              application: action.application,
              name: item.name,
              physicalName: item.physical_name,
              route: (
                (new Immutable.List(item.route))
                  .map(r => new ClusterRoute(toCamelCase(r)))
              ),
              meta: new ClusterMeta(toCamelCase(item.meta || {})),
            })),
          ),
        )
        .set('isFetching', false)
        .set('error', null);
    case types.CREATE_CLUSTER_BEGIN:
    case types.DELETE_CLUSTER_BEGIN:
      return state.set('isFetching', true)
        .set('error', null);
    case types.CREATE_CLUSTER_END:
    case types.DELETE_CLUSTER_END:
      if (action.error) {
        return state
          .set('isFetching', false)
          .set('error', action.error);
      }
      return state.set('isFetching', false);
    default:
      return state;
  }
};

const instance = combineReducers({
  config: instanceReducer('config'),
  switch: instanceReducer('switch'),
  service: instanceReducer('service'),
});

export default instance;

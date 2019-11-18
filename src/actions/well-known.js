import api from '../services/api';
import * as types from '../constants/actiontypes';
import { createAction, sideEffectCache, offlineStorage } from './utils';

export function fetchWellKnownData() {
  const client = api['.well-known'].common;
  return createAction({
    request: sideEffectCache({
      getCache: () => offlineStorage.load('wellKnownCommonData'),
      setCache: data => offlineStorage.dump('wellKnownCommonData', data),
      request: () => client.get(),
    }),
    response: response => ({
      data: response.data.data,
    }),
    types: [
      types.FETCH_WELL_KNOWN_DATA_BEGIN,
      types.FETCH_WELL_KNOWN_DATA_END,
    ],
  });
}

export function setupWellKnownData(store) {
  store.dispatch(fetchWellKnownData());
}

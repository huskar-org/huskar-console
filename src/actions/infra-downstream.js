import { normalize } from 'normalizr';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import * as schemas from '../constants/schemas';
import { createAction } from './utils';

function fetchData(applicationName, method) {
  const request = api['infra-config-downstream'](applicationName);
  return createAction({
    request: () => request[method](),
    response: r => normalize(r.data.data.downstream, [schemas.infraDownstreamSchema]),
    types: [
      types.REQUEST_INFRA_DOWNSTREAM,
      types.RECEIVE_INFRA_DOWNSTREAM,
    ],
  });
}

export function fetchInfraDownstream(applicationName) {
  return fetchData(applicationName, 'get');
}

export function invalidateInfraDownstream(applicationName) {
  return fetchData(applicationName, 'post');
}

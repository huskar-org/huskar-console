import api from '../services/api';
import * as types from '../constants/actiontypes';
import { batchFetchInstances } from './instance';
import { createAction, makePromiseChain } from './utils';

export function submitInfraConfig(payload) {
  const {
    applicationName,
    infraType,
    infraName,
    scopeType,
    scopeName,
    value,
  } = payload;
  const request = api['infra-config'](applicationName)(infraType)(infraName);
  return createAction({
    request: () => request.put({
      query: { scope_type: scopeType, scope_name: scopeName },
      json: value,
    }),
    response: () => ({}),
    types: [
      types.SUBMIT_INFRA_CONFIG_BEGIN,
      types.SUBMIT_INFRA_CONFIG_END,
    ],
    payload,
    next: (dispatch) => {
      dispatch(batchFetchInstances('config', applicationName));
    },
  });
}

export function deleteInfraConfig(payload) {
  const {
    applicationName,
    infraType,
    infraName,
    scopeType,
    scopeName,
  } = payload;
  const request = api['infra-config'](applicationName)(infraType)(infraName);
  return createAction({
    request: () => request.delete({
      query: { scope_type: scopeType, scope_name: scopeName },
      json: {},
    }),
    response: () => ({}),
    types: [
      types.DELETE_INFRA_CONFIG_BEGIN,
      types.DELETE_INFRA_CONFIG_END,
    ],
    payload,
    next: (dispatch) => {
      dispatch(batchFetchInstances('config', applicationName));
    },
  });
}

export function checkInfraConnective(applicationName, type, dsn) {
  const request = api['_check-infra-connective'];
  return createAction({
    payload: { applicationName, kind: type, dsn },
    request: () => request.post({ type, dsn }),
    response: response => ({
      applicationName,
      kind: type,
      dsn,
      status: response.data.status,
      message: response.data.message,
    }),
    types: [
      types.CHECK_INFRA_CONNECTIVE_BEGIN,
      types.CHECK_INFRA_CONNECTIVE_END,
    ],
  });
}

export function batchDeleteInfraConfigs(applicationName, payloads) {
  return createAction({
    request: () => makePromiseChain(payloads.map(payload => () => {
      const {
        infraType,
        infraName,
        scopeType,
        scopeName,
      } = payload;
      const request = api['infra-config'](applicationName)(infraType)(infraName);
      return request.delete({
        query: { scope_type: scopeType, scope_name: scopeName },
        json: {},
      });
    })),
    response: () => ({}),
    types: [
      types.DELETE_INFRA_CONFIG_BEGIN,
      types.DELETE_INFRA_CONFIG_END,
    ],
    next: (dispatch) => {
      dispatch(batchFetchInstances('config', applicationName));
    },
  });
}

export function renameInfraName(applicationName, oldPayloads, newPayloads) {
  return createAction({
    request: () => makePromiseChain(newPayloads.map(payload => () => {
      const {
        infraType,
        infraName,
        scopeType,
        scopeName,
        value,
      } = payload;
      const request = api['infra-config'](applicationName)(infraType)(infraName);
      return request.put({
        query: { scope_type: scopeType, scope_name: scopeName },
        json: value,
      });
    })),
    response: () => ({}),
    types: [
      types.SUBMIT_INFRA_CONFIG_BEGIN,
      types.SUBMIT_INFRA_CONFIG_END,
    ],
    next: (dispatch) => {
      dispatch(batchDeleteInfraConfigs(applicationName, oldPayloads));
    },
  });
}

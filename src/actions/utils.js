// TODO Build this utility into a Redux middleware
import _ from 'lodash';
import * as errors from '../constants/errors';

export function createAction(declaration) {
  const [requestType, receiveType] = declaration.types;
  return (dispatch) => {
    if (requestType) {
      dispatch({ type: requestType, payload: declaration.payload });
    }
    return declaration.request().then((resp) => {
      if ((Array.isArray(resp) && !resp.find(r => r.status >= 400)) || resp.status < 400) {
        const actionData = declaration.response(resp);
        dispatch({ type: receiveType, ...actionData });
        if (declaration.next) {
          declaration.next(dispatch);
        }
        return Promise.resolve();
      }
      const errResp = Array.isArray(resp) ? resp.find(r => r.status >= 400) : resp;
      const data = (errResp.status > 500 ? {
        status: errors.SYSTEM_ERROR,
        message: `SystemError: ${resp.status}`,
      } : errResp.data);
      const error = data || { message: 'Unknown error', status: null };
      let actionData = { type: receiveType, error };
      if (declaration.catch) {
        actionData = Object.assign({}, actionData, declaration.catch(error));
      }
      dispatch(actionData);
      return Promise.reject(new Error(error));
    });
  };
}

export function toSnakeCase(obj) {
  return Object.assign({}, ...Object.entries(obj)
    .map(([key, value]) => ({ [_.snakeCase(key)]: value })));
}

export function sideEffectCache({ getCache, setCache, request }) {
  const data = getCache();
  const sendData = () => Promise.resolve({ data, status: 304 });
  const sendRequest = () => request().then((resp) => {
    if (resp.status < 400) {
      setCache(resp.data);
    }
    return Promise.resolve(resp);
  });
  if (data) {
    sendRequest(); // Update cache in background
    return sendData;
  }
  return sendRequest;
}

export const offlineStorage = {
  load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (e) {
      localStorage.removeItem(key);
      return fallback;
    }
  },
  dump(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};

export function makePromiseChain(tasks) {
  return tasks.reduce((promiseChain, currentTask) => (
    promiseChain.then(chainResults => (
      currentTask().then(currentResult => [...chainResults, currentResult])
    ))
  ), Promise.resolve([]));
}

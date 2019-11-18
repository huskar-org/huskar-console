import { normalize } from 'normalizr';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import * as schemas from '../constants/schemas';
import { createAction } from './utils';

export function fetchUserSession() {
  return createAction({
    request: () => api.whoami.get(),
    response: ({ data }) => {
      const { entities, result } = normalize(data.data, schemas.userSessionSchema);
      const record = new schemas.UserSession(entities.userSessions[result]);
      return { data: record };
    },
    types: [
      types.REQUEST_USER_WHOAMI,
      types.RECEIVE_USER_WHOAMI,
    ],
  });
}

export function signIn(username, password) {
  return createAction({
    request: () => api.auth.token.post({ username, password }),
    response: response => response.data.data,
    next: (dispatch) => {
      dispatch(fetchUserSession()); // Refresh user session
    },
    types: [
      types.REQUEST_USER_SIGNIN,
      types.RECEIVE_USER_SIGNIN,
    ],
  });
}

export function signOut() {
  return (dispatch) => {
    dispatch({ type: types.REQUEST_USER_SIGNOUT });
    return dispatch(fetchUserSession()); // Refresh user session
  };
}

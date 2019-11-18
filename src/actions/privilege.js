import _ from 'lodash';
import { camelCase } from 'change-case';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import { createAction } from './utils';

export function fetchPrivileges(applicationName) {
  return createAction({
    request: () => api.auth.application(applicationName).get(),
    response: ({ data }) => {
      const authList = data.data.application_auth
        .map(item => ({
          authority: item.authority,
          user: _.mapKeys(item.user, (v, k) => camelCase(k)),
          username: item.user.username, // For filter compatible
        }))
        .filter(item => item.user.username !== applicationName)
        .filter(item => item.user.isActive);
      return {
        privileges: _.sortBy(authList, [
          (o => o.user.isApplication),
          (o => o.user.username),
          (o => o.authority),
        ]),
      };
    },
    types: [
      types.FETCH_PRIVILEGE_BEGIN,
      types.FETCH_PRIVILEGE_END,
    ],
  });
}

export function createPrivilege(applicationName, username, authority) {
  return createAction({
    request: () => {
      const data = {
        username,
        authority,
      };
      return api.auth.application(applicationName).post(data);
    },
    response: () => {},
    types: [
      types.CREATE_PRIVILEGE_BEGIN,
      types.CREATE_PRIVILEGE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchPrivileges(applicationName));
    },
  });
}

export function deletePrivilege(applicationName, username, authority) {
  return createAction({
    request: () => {
      const data = {
        username,
        authority,
      };
      return api.auth.application(applicationName).delete(data);
    },
    response: () => {},
    types: [
      types.DELETE_PRIVILEGE_BEGIN,
      types.DELETE_PRIVILEGE_END,
    ],
    next: (dispatch) => {
      dispatch(fetchPrivileges(applicationName));
    },
  });
}

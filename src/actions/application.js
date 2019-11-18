import { normalize } from 'normalizr';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import * as schemas from '../constants/schemas';
import { createAction, sideEffectCache, offlineStorage } from './utils';

export function fetchApplication(applicationName) {
  return createAction({
    request: () => api.application(applicationName).get(),
    response: ({ data }) => {
      const { item } = data.data;
      const { entities, result } = normalize(item, schemas.applicationSchema);
      return { entities, result, applicationName };
    },
    types: [
      types.REQUEST_APPLICATION,
      types.RECEIVE_APPLICATION,
    ],
    payload: {
      applicationName,
    },
  });
}

export function fetchApplicationList() {
  return createAction({
    request: sideEffectCache({
      getCache: () => offlineStorage.load('applicationTree'),
      setCache: data => offlineStorage.dump('applicationTree', data),
      request: () => api.application.get(),
    }),
    response: ({ data }) => {
      const { entities, result } = normalize(data.data, [schemas.applicationSchema]);
      return { entities, result };
    },
    types: [
      types.REQUEST_APPLICATION_LIST,
      types.RECEIVE_APPLICATION_LIST,
    ],
  });
}

export function createApplication(applicationName, teamName) {
  const payload = { applicationName, teamName };
  return createAction({
    request: () => api.application.post({
      application: applicationName,
      team: teamName,
    }),
    response: () => {
      const { entities, result } = normalize({
        name: applicationName,
        team: teamName,
      }, schemas.applicationSchema);
      return { entities, result };
    },
    types: [
      types.CREATE_APPLICATION_BEGIN,
      types.CREATE_APPLICATION_END,
    ],
    payload,
  });
}

export function deleteApplication(applicationName) {
  const payload = { applicationName };
  return createAction({
    request: () => api.application(applicationName).delete(),
    response: () => payload,
    types: [
      types.DELETE_APPLICATION_BEGIN,
      types.DELETE_APPLICATION_END,
    ],
    payload,
  });
}

export function fetchTeams() {
  return createAction({
    request: () => api.team.get(),
    response: ({ data }) => {
      const { teams } = data.data;
      const { entities, result } = normalize(teams, [schemas.teamSchema]);
      return { entities, result };
    },
    types: [
      types.REQUEST_TEAMS,
      types.RECEIVE_TEAMS,
    ],
  });
}

export function createTeam(teamName) {
  const payload = { teamName };
  return createAction({
    request: () => api.team.post({ team: teamName }),
    response: () => {
      const { entities, result } = normalize({ name: teamName }, schemas.teamSchema);
      return { entities, result };
    },
    types: [
      types.CREATE_TEAM_BEGIN,
      types.CREATE_TEAM_END,
    ],
    payload,
  });
}

export function deleteTeam(teamName) {
  const payload = { teamName };
  return createAction({
    request: () => api.team(teamName).delete(),
    response: () => payload,
    types: [
      types.DELETE_TEAM_BEGIN,
      types.DELETE_TEAM_END,
    ],
    payload,
  });
}

import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  isApplicationFetching: new Immutable.Map({
    '*': false,
  }),
  isApplicationChanging: new Immutable.Map({
    '*': false,
  }),
  isTeamFetching: false,
  isTeamChanging: false,
  error: null,
  applications: new Immutable.List(),
  teams: new Immutable.List(),
});

export default function application(state = initialState, action) {
  // Processes errors
  switch (action.type) {
    case types.CREATE_APPLICATION_END:
    case types.DELETE_APPLICATION_END:
      if (action.error) {
        return state
          .set('error', action.error)
          .setIn(['isApplicationChanging', '*'], false);
      }
      break;
    case types.CREATE_TEAM_END:
    case types.DELETE_TEAM_END:
      if (action.error) {
        return state
          .set('error', action.error)
          .set('isTeamChanging', false);
      }
      break;
    default:
      break;
  }

  switch (action.type) {
    case types.REQUEST_APPLICATION:
      return state
        .setIn(['isApplicationFetching', action.payload.applicationName], true);
    case types.RECEIVE_APPLICATION:
      return state
        .update('applications', v => v.toSet().add(action.result).sort().toList())
        .setIn(['isApplicationFetching', action.applicationName], false);
    case types.REQUEST_APPLICATION_LIST:
      return state
        .set('applications', new Immutable.List())
        .setIn(['isApplicationFetching', '*'], true);
    case types.RECEIVE_APPLICATION_LIST:
      if (action.error) {
        return state.set('applications', new Immutable.List())
          .set('error', action.error)
          .setIn(['isApplicationFetching', '*'], false);
      }
      return state.set('applications', new Immutable.List(action.result))
        .set('error', null)
        .setIn(['isApplicationFetching', '*'], false);
    case types.REQUEST_TEAMS:
      return state
        .set('teams', new Immutable.List())
        .set('isTeamFetching', true);
    case types.RECEIVE_TEAMS:
      if (action.error) {
        return state.set('applications', new Immutable.List())
          .set('error', action.error)
          .set('isTeamFetching', false);
      }
      return state.set('teams', new Immutable.List(action.result))
        .set('error', null)
        .set('isTeamFetching', false);
    case types.CREATE_TEAM_BEGIN:
    case types.DELETE_TEAM_BEGIN:
      return state.set('isTeamChanging', true);
    case types.CREATE_APPLICATION_BEGIN:
    case types.DELETE_APPLICATION_BEGIN:
      return state.set('isApplicationChanging', true);
    case types.CREATE_APPLICATION_END:
      return state
        .update('applications', items => items.push(action.result))
        .setIn(['isApplicationChanging', '*'], false);
    case types.CREATE_TEAM_END:
      return state.update('teams', items => items.push(action.result))
        .set('isTeamChanging', false);
    case types.DELETE_APPLICATION_END:
      return state
        .update('applications', items => items.filter((
          i => i !== action.applicationName
        )))
        .setIn(['isApplicationChanging', '*'], false);
    case types.DELETE_TEAM_END:
      return state.update('teams', items => items.filter((
        i => i !== action.teamName
      )))
        .set('isTeamChanging', false);
    default:
      return state;
  }
}

import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  error: null,
  isChanging: true,
  privileges: new Immutable.List(),
});

export default function privilege(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_PRIVILEGE_BEGIN:
      return state.set('isChanging', true);
    case types.FETCH_PRIVILEGE_END:
      if (action.error) {
        return state.set('error', action.error)
          .set('isChanging', false);
      }
      return state.set('error', null)
        .set('isChanging', false)
        .set('privileges', new Immutable.List(
          action.privileges,
        ));
    case types.CREATE_PRIVILEGE_BEGIN:
    case types.DELETE_PRIVILEGE_BEGIN:
      return state.set('isChanging', true);
    case types.CREATE_PRIVILEGE_END:
    case types.DELETE_PRIVILEGE_END:
      return state.set('isChanging', false);
    default:
      return state;
  }
}

import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  scope: new Immutable.Map(),
});

export default function snooze(state = initialState, action) {
  switch (action.type) {
    case types.SNOOZE_BY_SCOPE:
      return state.setIn(['scope', action.scope], action.until);
    default:
      return state;
  }
}

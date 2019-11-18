import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  isSummitHour: false,
});

export default function minimal(state = initialState, action) {
  switch (action.type) {
    case types.ENTER_SUMMIT_HOUR:
      return state.set('isSummitHour', true);
    case types.LEAVE_SUMMIT_HOUR:
      return state.set('isSummitHour', false);
    default:
      return state;
  }
}

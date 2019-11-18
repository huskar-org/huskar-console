import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  info: null,
  readOnly: null,
  bypass: false,
});

export default function releaseWindow(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_RELEASE_WINDOW_INFO:
      return state.set('info', action.info);
    case types.SET_RELEASE_WINDOW_STATE:
      return state.set('readOnly', action.readOnly);
    case types.SET_RELEASE_WINDOW_BYPASS:
      return state.set('bypass', true);
    default:
      return state;
  }
}

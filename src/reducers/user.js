import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  currentUser: null,
  currentUserState: 'idle',
  signInState: 'idle',
});

export default function user(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_USER_WHOAMI:
      return state.set('currentUserState', 'loading');
    case types.RECEIVE_USER_WHOAMI:
      if (action.error) {
        return state.set('currentUserState', 'error')
          .set('currentUser', null);
      }
      return state.set('currentUserState', 'success')
        .set('currentUser', action.data);
    case types.REQUEST_USER_SIGNIN:
      return state.set('signInState', 'loading');
    case types.RECEIVE_USER_SIGNIN:
      if (action.error) {
        localStorage.removeItem('token'); // XXX Side effect
        return state.set('signInState', 'error');
      }
      localStorage.setItem('token', action.token); // XXX Side effect
      return state.set('signInState', 'success');
    case types.REQUEST_USER_SIGNOUT:
      localStorage.removeItem('token'); // XXX Side effect
      return state;
    default:
      return state;
  }
}

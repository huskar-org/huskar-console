import Immutable from 'immutable';
import user from '../user';
import * as types from '../../constants/actiontypes';
import * as schemas from '../../constants/schemas';


describe('user reducers', () => {
  const initialState = new Immutable.Map({
    currentUser: null,
    currentUserState: 'idle',
    signInState: 'idle',
  });

  it('should return the initial state', () => {
    expect(user(undefined, {})).toEqual(initialState);
  });

  it('should handle REQUEST_USER_WHOAMI', () => {
    const expected = new Immutable.Map({
      currentUser: null,
      currentUserState: 'loading',
      signInState: 'idle',
    });
    expect(user(initialState, { type: types.REQUEST_USER_WHOAMI })).toEqual(expected);
  });

  it('should handle RECEIVE_USER_WHOAMI with error', () => {
    const expected = new Immutable.Map({
      currentUser: null,
      currentUserState: 'error',
      signInState: 'idle',
    });
    expect(user(initialState, { type: types.RECEIVE_USER_WHOAMI, error: 'xxx' })).toEqual(expected);
  });

  it('should handle RECEIVE_USER_WHOAMI without error', () => {
    const expected = new Immutable.Map({
      currentUser: new schemas.UserSession({
        username: 'foobar',
        isAnonymous: false,
      }),
      currentUserState: 'success',
      signInState: 'idle',
    });
    expect(user(initialState, {
      type: types.RECEIVE_USER_WHOAMI,
      data: new schemas.UserSession({
        username: 'foobar',
        isAnonymous: false,
      }),
    })).toEqual(expected);
  });
});

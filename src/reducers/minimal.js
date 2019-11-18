import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  punchWindow: new Immutable.List(),
});

export default function minimal(state = initialState, action) {
  switch (action.type) {
    case types.PUNCH_MINIMAL_MODE:
      return state.update(
        'punchWindow', p => p.unshift(action.payload).setSize(10),
      );
    case types.FLUSH_MINIMAL_MODE:
      return state.set('punchWindow', new Immutable.List());
    default:
      return state;
  }
}

import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  state: 'idle',
  data: new Immutable.Map(),
});

export default function wellKnown(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_WELL_KNOWN_DATA_BEGIN:
      return state.set('state', 'loading');
    case types.FETCH_WELL_KNOWN_DATA_END:
      if (action.error) {
        return state.set('state', 'error').set('data', new Immutable.Map());
      }
      return state.set('state', 'success').set('data', new Immutable.Map(action.data));
    default:
      return state;
  }
}

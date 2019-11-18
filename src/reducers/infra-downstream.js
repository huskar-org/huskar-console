import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  state: 'idle',
  items: [],
});

export default function infraDownstream(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_INFRA_DOWNSTREAM:
      return state.set('state', 'loading');
    case types.RECEIVE_INFRA_DOWNSTREAM:
      if (action.error) {
        return state.set('state', 'error');
      }
      return state.set('state', 'success')
        .set('items', action.result);
    default:
      return state;
  }
}

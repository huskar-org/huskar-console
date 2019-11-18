import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  isFetching: false,
  data: {},
  error: null,
});

export default function serviceInfo(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_SERVICE_INFO_BEGIN:
    case types.CLEAR_SERVICE_INFO_BEGIN:
    case types.PUT_SERVICE_INFO_BEGIN:
      return state.set('isFetching', true);
    case types.FETCH_SERVICE_INFO_END:
      if (action.error) {
        return state
          .set('data', {})
          .set('error', action.error)
          .set('isFetching', false);
      }
      return state
        .set('data', action.data)
        .set('isFetching', false)
        .set('error', null);
    case types.CLEAR_SERVICE_INFO_END:
    case types.PUT_SERVICE_INFO_END:
    case types.DISCARD_SERVICE_INFO:
      return state
        .set('data', {})
        .set('error', action.error || null)
        .set('isFetching', false);
    default:
      return state;
  }
}

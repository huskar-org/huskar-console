import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  error: null,
  isChanging: false,
  version: 0,
});

export default function infraConfig(state = initialState, action) {
  switch (action.type) {
    case types.SUBMIT_INFRA_CONFIG_BEGIN:
    case types.DELETE_INFRA_CONFIG_BEGIN:
      return state.set('isChanging', true);
    case types.SUBMIT_INFRA_CONFIG_END:
    case types.DELETE_INFRA_CONFIG_END:
      if (action.error) {
        return state.set('error', action.error)
          .set('isChanging', false);
      }
      return state.set('error', null)
        .set('isChanging', false)
        .update('version', v => v + 1);
    default:
      return state;
  }
}

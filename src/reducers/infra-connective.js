import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  error: null,
  result: new Immutable.List(),
});

export default function infraConnective(state = initialState, action) {
  switch (action.type) {
    case types.CHECK_INFRA_CONNECTIVE_BEGIN: {
      const result = state.get('result').filter(v => v.dsn !== action.payload.dsn);
      return state.set('error', null)
        .set('result', result);
    }
    case types.CHECK_INFRA_CONNECTIVE_END: {
      if (action.error) {
        return state.set('error', action.error);
      }

      const result = state.get('result').filter(v => v.dsn !== action.dsn);
      const item = {
        applicationName: action.applicationName,
        kind: action.kind,
        dsn: action.dsn,
        status: action.status,
        message: action.message,
      };
      return state.set('error', null)
        .set('result', result.concat(item));
    }
    default:
      return state;
  }
}

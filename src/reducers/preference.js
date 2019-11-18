import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const State = new Immutable.Record({
  isDateTimeRelative: false,
  isFullApplicationTree: true,
});
const persist = (state) => {
  localStorage.preference = JSON.stringify(state.toJS());
  return state;
};

let initialState = new State();
try {
  initialState = new State(JSON.parse(window.localStorage.preference));
} catch (e) {
  persist(initialState);
}

function preference(state = initialState, action) {
  switch (action.type) {
    case types.PREFERENCE_DATETIME_RELATIVE:
      return state.set('isDateTimeRelative', action.value);
    case types.PREFERENCE_FULL_APPLICATION_TREE:
      return state.set('isFullApplicationTree', action.value);
    default:
      return state;
  }
}

export default function persistedPreference(state = initialState, action) {
  const nextState = preference(state, action);
  return persist(nextState);
}

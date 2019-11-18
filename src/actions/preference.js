import * as types from '../constants/actiontypes';

function createToggleAction({ type, key }) {
  return (dispatch, getState) => {
    const { preference } = getState();
    const value = !preference.get(key);
    dispatch({ type, value });
  };
}

export function toggleDateTimeRelative() {
  return createToggleAction({
    type: types.PREFERENCE_DATETIME_RELATIVE,
    key: 'isDateTimeRelative',
  });
}

export function toggleFullApplicationTree() {
  return createToggleAction({
    type: types.PREFERENCE_FULL_APPLICATION_TREE,
    key: 'isFullApplicationTree',
  });
}

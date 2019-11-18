import * as types from '../constants/actiontypes';


export function changeReadOnlyState(readOnlyState) {
  return { type: types.SET_RELEASE_WINDOW_STATE, readOnly: readOnlyState };
}

export function setReadOnlyBypass() {
  return { type: types.SET_RELEASE_WINDOW_BYPASS };
}

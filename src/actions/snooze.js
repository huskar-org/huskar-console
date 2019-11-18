import * as types from '../constants/actiontypes';

export function snooze(scope, seconds) {
  if (seconds <= 0) throw new Error('Snooze seconds must be positive');
  const until = (+new Date()) + (seconds * 1000);
  return { type: types.SNOOZE_BY_SCOPE, scope, until };
}

export function cancelSnooze(scope) {
  return { type: types.SNOOZE_BY_SCOPE, scope };
}

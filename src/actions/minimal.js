import * as types from '../constants/actiontypes';

export function punchMinimalMode(isMinimalMode) {
  const payload = Boolean(isMinimalMode);
  return { type: types.PUNCH_MINIMAL_MODE, payload };
}

export function flushMinimalMode() {
  return { type: types.FLUSH_MINIMAL_MODE };
}

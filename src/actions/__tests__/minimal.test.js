import * as types from '../../constants/actiontypes';
import { punchMinimalMode, flushMinimalMode } from '../minimal';

it('punchMinimalMode should create PUNCH_MINIMAL_MODE', () => {
  const expected = { type: types.PUNCH_MINIMAL_MODE, payload: true };
  expect(punchMinimalMode(true)).toEqual(expected);

  expect(punchMinimalMode(false)).toEqual(Object.assign({}, expected, { payload: false }));
});

it('flushMinimalMode should create FLUSH_MINIMAL_MODE', () => {
  const expected = { type: types.FLUSH_MINIMAL_MODE };
  expect(flushMinimalMode()).toEqual(expected);
});

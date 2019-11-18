import Immutable from 'immutable';
import minimal from '../minimal';
import * as types from '../../constants/actiontypes';


describe('minimal reducers', () => {
  it('should return the initial state', () => {
    const initialState = new Immutable.Map({
      punchWindow: new Immutable.List(),
    });

    expect(minimal(undefined, {})).toEqual(initialState);
  });

  it('should handle PUNCH_MINIMAL_MODE', () => {
    const state = new Immutable.Map({
      punchWindow: new Immutable.List([233]),
    });
    const expected = new Immutable.Map({
      punchWindow: new Immutable.List(),
    });
    expect(minimal(state, {
      type: types.FLUSH_MINIMAL_MODE,
    })).toEqual(expected);
  });
});

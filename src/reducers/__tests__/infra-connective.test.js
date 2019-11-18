import Immutable from 'immutable';
import infraConnective from '../infra-connective';
import * as types from '../../constants/actiontypes';

describe('infra-connective reducers', () => {
  const applicationName = 'bar';
  const dsn = 'sam+mysql://127.0.0.1';

  it('should return the initial state', () => {
    const initialState = new Immutable.Map({
      error: null,
      result: new Immutable.List(),
    });

    expect(infraConnective(undefined, {})).toEqual(initialState);
  });

  it('should handle CHECK_INFRA_CONNECTIVE_BEGIN', () => {
    const state = new Immutable.Map({
      error: 'error',
      result: new Immutable.List([
        {
          applicationName: 'foo',
          dsn: 'redis://',
          status: 'success',
          message: '',
        },
        {
          applicationName,
          dsn,
          status: 'failed',
          message: 'error',
        },
      ]),
    });
    const action = {
      type: types.CHECK_INFRA_CONNECTIVE_BEGIN,
      payload: {
        applicationName,
        dsn,
      },
    };
    const expected = new Immutable.Map({
      error: null,
      result: new Immutable.List([
        {
          applicationName: 'foo',
          dsn: 'redis://',
          status: 'success',
          message: '',
        },
      ]),
    });

    expect(infraConnective(state, action)).toEqual(expected);
  });

  it('should handle CHECK_INFRA_CONNECTIVE_END with error', () => {
    const state = new Immutable.Map({
      error: null,
      result: new Immutable.List(),
    });
    const action = { type: types.CHECK_INFRA_CONNECTIVE_END, error: 'error' };
    const expected = new Immutable.Map({
      error: 'error',
      result: new Immutable.List(),
    });

    expect(infraConnective(state, action)).toEqual(expected);
  });

  it('should handle CHECK_INFRA_CONNECTIVE_END without error', () => {
    const state = new Immutable.Map({
      error: 'error',
      result: new Immutable.List([
        {
          applicationName: 'foo',
          dsn: 'redis://',
          status: 'success',
          message: '',
        },
        {
          applicationName,
          dsn,
          status: 'failed',
          message: 'error',
        },
      ]),
    });
    const action = {
      type: types.CHECK_INFRA_CONNECTIVE_END,
      applicationName,
      dsn,
      status: 'success',
      message: 'ok',
    };
    const expected = new Immutable.Map({
      error: null,
      result: new Immutable.List([
        {
          applicationName: 'foo',
          dsn: 'redis://',
          status: 'success',
          message: '',
        },
        {
          applicationName,
          dsn,
          status: 'success',
          message: 'ok',
        },
      ]),
    });

    expect(infraConnective(state, action)).toEqual(expected);
  });
});

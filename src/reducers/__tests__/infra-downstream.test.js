import Immutable from 'immutable';
import { normalize } from 'normalizr';
import entityReducer from '../entity';
import infraDownstreamReducer from '../infra-downstream';
import * as types from '../../constants/actiontypes';
import * as schemas from '../../constants/schemas';


describe('infra-downstream reducers', () => {
  const initialState = new Immutable.Map({
    state: 'idle',
    items: [],
  });

  it('should return the initial state', () => {
    expect(infraDownstreamReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle REQUEST_INFRA_DOWNSTREAM', () => {
    const expected = new Immutable.Map({
      state: 'loading',
      items: [],
    });
    expect(infraDownstreamReducer(initialState, {
      type: types.REQUEST_INFRA_DOWNSTREAM,
    })).toEqual(expected);
  });

  it('should handle RECEIVE_INFRA_DOWNSTREAM', () => {
    const { entities, result } = normalize([{
      id: 100001,
      created_at: '2018-08-28T22:42:55+08:00',
      updated_at: '2018-08-28T22:51:15+08:00',
      user_application_name: 'foo.bar',
      user_infra_name: 'test',
      user_infra_type: 'oss',
      user_scope_pair: { name: 'alta1', type: 'idcs' },
      user_field_name: 'url',
      version: 1535467875241,
    }], [schemas.infraDownstreamSchema]);
    const action = { type: types.RECEIVE_INFRA_DOWNSTREAM, entities, result };
    const expected = new Immutable.Map({
      state: 'success',
      items: [100001],
    });
    const expectedEntities = new Immutable.Map({
      100001: new schemas.InfraDownstream({
        id: 100001,
        createdAt: new Date('2018-08-28T22:42:55+08:00'),
        updatedAt: new Date('2018-08-28T22:51:15+08:00'),
        userApplicationName: 'foo.bar',
        userInfraName: 'test',
        userInfraType: 'oss',
        userScopeName: 'alta1',
        userScopeType: 'idcs',
        userFieldName: 'url',
        version: 1535467875241,
      }),
    });
    expect(infraDownstreamReducer(initialState, action)).toEqual(expected);
    expect(entityReducer(undefined, action).get('infraDownstreams')).toEqual(expectedEntities);
  });

  it('should handle RECEIVE_INFRA_DOWNSTREAM with error', () => {
    const action = { type: types.RECEIVE_INFRA_DOWNSTREAM, error: {} };
    const expected = new Immutable.Map({
      state: 'error',
      items: [],
    });
    expect(infraDownstreamReducer(initialState, action)).toEqual(expected);
  });

  it('selectors should work', () => {
    const infraDownstream = new Immutable.Map({
      state: 'loading',
      items: [100001],
    });
    const entity = new Immutable.Map({
      infraDownstreams: new Immutable.Map({
        100001: new schemas.InfraDownstream({
          id: 100001,
          createdAt: new Date('2018-08-28T22:42:55+08:00'),
          updatedAt: new Date('2018-08-28T22:51:15+08:00'),
          userApplicationName: 'foo.bar',
          userInfraName: 'test',
          userInfraType: 'oss',
          userScopeName: 'alta1',
          userScopeType: 'idcs',
          userFieldName: 'url',
          version: 1535467875241,
        }),
      }),
    });
    const state = { infraDownstream, entity };

    expect(schemas.infraDownstreamStateSelector(state)).toEqual('loading');
    expect(schemas.infraDownstreamItemsSelector(state))
      .toEqual([
        new schemas.InfraDownstream({
          id: 100001,
          createdAt: new Date('2018-08-28T22:42:55+08:00'),
          updatedAt: new Date('2018-08-28T22:51:15+08:00'),
          userApplicationName: 'foo.bar',
          userInfraName: 'test',
          userInfraType: 'oss',
          userScopeName: 'alta1',
          userScopeType: 'idcs',
          userFieldName: 'url',
          version: 1535467875241,
        }),
      ]);
  });
});

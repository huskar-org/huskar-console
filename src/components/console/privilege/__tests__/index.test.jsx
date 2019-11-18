import React from 'react';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import Privilege from '../index';

const mockStore = configureMockStore([thunk]);

describe('Privilege List', () => {
  it('render success', () => {
    const state = new Immutable.Map({
      error: null,
      isChanging: false,
      privileges: new Immutable.List([
        {
          authority: 'write',
          user: {
            createdAt: '2018-02-28T12:35:57+08:00',
            email: null,
            huskarAdmin: false,
            id: 5862,
            isActive: true,
            isAdmin: false,
            isApplication: false,
            lastLogin: null,
            updatedAt: '2018-02-28T12:35:57+08:00',
            username: 'test',
          },
          username: 'test',
        },
        {
          authority: 'read',
          user: {
            createdAt: '2018-02-28T12:35:57+08:00',
            email: null,
            huskarAdmin: false,
            id: 5862,
            isActive: true,
            isAdmin: false,
            isApplication: false,
            lastLogin: null,
            updatedAt: '2018-02-28T12:35:57+08:00',
            username: 'test',
          },
          username: 'test',
        },
        {
          authority: 'read',
          user: {
            createdAt: '2016-01-07T14:47:56+08:00',
            email: null,
            huskarAdmin: false,
            id: 107,
            isActive: true,
            isAdmin: false,
            isApplication: true,
            lastLogin: null,
            updatedAt: '2017-07-27T17:21:50+08:00',
            username: 'foo.bar',
          },
          username: 'foo.bar',
        },
        {
          authority: 'write',
          user: {
            createdAt: '2017-10-10T15:21:59+08:00',
            email: null,
            huskarAdmin: false,
            id: 5841,
            isActive: true,
            isAdmin: false,
            isApplication: true,
            lastLogin: null,
            updatedAt: '2017-10-10T15:21:59+08:00',
            username: 'foo.bbb',
          },
          username: 'foo.bbb',
        },
      ]),
    });
    const store = mockStore({
      privilege: state,
      alarm: new Immutable.Map({ isSummitHour: true }),
    });
    const applicationName = 'foo.bar';
    const wrapper = mount((
      <Provider store={store}>
        <Privilege params={{ applicationName }} />
      </Provider>
    ));
    expect(wrapper.find(Privilege).length).toEqual(1);
    const { privileges } = wrapper.find('Privilege').first().props();
    expect(privileges).toEqual(state.get('privileges').toJS());

    const trList = wrapper.find('tbody tr');
    expect(trList.length).toEqual(privileges.length);

    const remainPrivileges = {};
    privileges.forEach((p) => {
      remainPrivileges[`${p.user.username}+${p.authority}`] = {
        user: p.user,
        authority: p.authority,
      };
    });
    trList.forEach((tr) => {
      const userLable = tr.find('UserLabel').first();
      const { user } = userLable.props();
      const authority = tr.find('td').at(1).text();
      const key = `${user.username}+${authority}`;
      const got = remainPrivileges[key];
      expect(got.authority).toEqual(authority);
      delete remainPrivileges[key];
    });
    expect(Object.keys(remainPrivileges).length).toEqual(0);
  });
});

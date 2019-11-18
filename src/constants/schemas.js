import Immutable from 'immutable';
import _ from 'lodash';
import { camelCase } from 'change-case';
import { schema, denormalize } from 'normalizr';
import { createSelector } from 'reselect';
import { INFRA_PREFIX_LIST } from './common';
import { ROUTE_EZONE_CLUSTERS } from './env';
import { WellKnownData } from '../structures';

function camelCaseStrategy(value) {
  return _.mapKeys(value, (v, k) => camelCase(k));
}

// Entities

export const AuditLog = Immutable.Record({
  id: undefined,
  actionName: '',
  actionData: '',
  remoteAddr: '',
  createdAt: undefined,
  rollbackTo: null,
  user: null,
});

export const User = Immutable.Record({
  username: undefined,
  email: undefined,
  isActive: undefined,
  isAdmin: undefined,
  isApplication: undefined,
  lastLogin: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const UserSession = Immutable.Record({
  username: '',
  isAnonymous: true,
  isAdmin: false,
});

export const Team = Immutable.Record({
  name: undefined,
  desc: undefined,
});

export const Application = Immutable.Record({
  name: undefined,
  team: new Team(),
  routeStage: {},
  isDeprecated: false,
  isInfra: false,
});

export const Scene = Immutable.Record({
  name: '',
  shortDescription: '',
  longDescription: '',
  isGlobal: false,
  groupName: '',
  groupDesc: '',
  currentLevel: '',
  isChanging: false,
});

export const InfraDownstream = Immutable.Record({
  id: 0,
  userApplicationName: '',
  userInfraName: '',
  userInfraType: '',
  userScopeName: '',
  userScopeType: '',
  userFieldName: 'url',
  version: 0,
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
});

// Schemas

export const userSchema = new schema.Entity('users', {}, {
  idAttribute: 'username',
  processStrategy: camelCaseStrategy,
});

export const userSessionSchema = new schema.Entity('userSessions', {}, {
  idAttribute: 'username',
  processStrategy: camelCaseStrategy,
});

export const auditSchema = new schema.Entity('audits', {}, {
  processStrategy: camelCaseStrategy,
});
auditSchema.define({
  user: userSchema,
  rollback_to: auditSchema,
});

export const teamSchema = new schema.Entity('teams', {}, {
  idAttribute: 'name',
  processStrategy: value => ({ name: value.name, desc: value.desc || value.name }),
});

export const infraDownstreamSchema = new schema.Entity('infraDownstreams', {}, {
  idAttribute: 'id',
  processStrategy: (value) => {
    const v = camelCaseStrategy(value);
    const result = Object.assign({}, v, {
      userScopeType: v.userScopePair.type,
      userScopeName: v.userScopePair.name,
      createdAt: new Date(v.createdAt),
      updatedAt: new Date(v.updatedAt),
    });
    delete result.userScopePair;
    return result;
  },
});

const routeStageMap = _.toPairs(ROUTE_EZONE_CLUSTERS)
  .map(([ezone, cluster]) => [cluster, ezone])
  .reduce((acc, [k, v]) => Object.assign({}, acc, { [k]: acc[k] ? acc[k].concat(v) : [v] }), {});
export const applicationSchema = new schema.Entity('applications', {
  team: teamSchema,
}, {
  idAttribute: 'name',
  processStrategy: (rawData) => {
    const { name, team, teamName, teamDesc, isDeprecated, routeStage } = camelCaseStrategy(rawData);
    const ezonesRouteStage = {};
    Object.entries(routeStageMap).forEach(([clusterName, ezones]) => {
      ezones.forEach((e) => {
        ezonesRouteStage[e] = routeStage[clusterName] || null;
      });
    });
    return {
      name,
      isDeprecated,
      routeStage: ezonesRouteStage,
      team: { name: team || teamName, desc: teamDesc || teamName || team },
      isInfra: INFRA_PREFIX_LIST.some(p => name.startsWith(p)),
    };
  },
});

// Selectors

const entitySelector = state => state.entity;
const applicationSelector = state => state.application.get('applications');
const teamSelector = state => state.application.get('teams');

export const userSessionSelector = state => state.user.get('currentUser');
export const userSessionStateSelector = state => state.user.get('currentUserState');
export const userSignInStateSelector = state => state.user.get('signInState');

export const applicationLoadingSelector = applicationName => state => (
  state.application.getIn(['isApplicationFetching', applicationName]) || false
);

export const applicationChangingSelector = applicationName => state => (
  state.application.getIn(['isApplicationChanging', applicationName]) || false
);

export const applicationTreeLoadingSelector = state => (
  state.application.getIn(['isApplicationFetching', '*'])
  || state.application.get('isTeamFetching')
);

export const applicationTreeChangingSelector = state => (
  state.application.getIn(['isApplicationChanging', '*'])
  || state.application.get('isTeamChanging')
);

export const applicationListSelector = createSelector(
  entitySelector,
  applicationSelector,
  (entity, items) => denormalize(items.sort(), [applicationSchema], entity).toArray(),
);

export const applicationItemSelector = (name, noset = null) => state => (
  denormalize(name, applicationSchema, entitySelector(state)) || noset
);

export const teamListSelector = createSelector(
  entitySelector,
  teamSelector,
  (entity, items) => denormalize(items.sort(), [teamSchema], entity).toArray(),
);

export const teamItemSelector = (name, noset = null) => state => (
  denormalize(name, teamSchema, entitySelector(state)) || noset
);

export const applicationTreeSelector = createSelector(
  applicationListSelector,
  applicationList => applicationList.reduce((prev, item) => {
    const teamName = item.get('team').get('name');
    const tree = { [teamName]: [], ...prev };
    tree[teamName].push(item);
    return tree;
  }, {}),
);

export const instanceFetchingSelector = instanceType => state => (
  state.instance[instanceType].get('isFetching')
);

export const instanceChangingSelector = instanceType => state => (
  state.instance[instanceType].get('isInstancesChanging')
);

export const instanceErrorSelector = instanceType => state => (
  state.instance[instanceType].get('error')
);

export const instanceListSelector = (instanceType, applicationName) => state => (
  new Immutable.List(state.instance[instanceType]
    .getIn(['instances', applicationName], []))
);

export const clusterListSelector = (instanceType, applicationName) => state => (
  state.instance[instanceType]
    .getIn(['clusters', applicationName], new Immutable.OrderedSet())
);

export const clusterMapSelector = instanceType => state => (
  state.instance[instanceType].get('clusters', new Immutable.OrderedMap())
);

export const infraConfigChangingSelector = state => state.infraConfig.get('isChanging');
export const infraConfigVersionSelector = state => state.infraConfig.get('version');

export const infraDownstreamStateSelector = state => state.infraDownstream.get('state');
export const infraDownstreamItemsSelector = createSelector(
  entitySelector,
  state => state.infraDownstream.get('items'),
  (entity, items) => denormalize(items, [infraDownstreamSchema], entity),
);

export const privilegeListSelector = state => state.privilege.get(
  'privileges', new Immutable.List(),
);
export const privilegeIsChangingSelector = state => state.privilege.get('isChanging', false);

export const wellKnownDataSelector = state => WellKnownData.parse(state.wellKnown.get('data').toJS());
export const wellKnownStateSelector = state => state.wellKnown.get('state');

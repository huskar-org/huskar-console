import Immutable from 'immutable';
import * as schemas from '../constants/schemas';

const initialState = new Immutable.Map({
  users: new Immutable.Map(),
  audits: new Immutable.Map(),
  applications: new Immutable.Map(),
  teams: new Immutable.Map(),
});
const recordTypes = new Immutable.Map({
  users: schemas.User,
  userSessions: schemas.UserSession,
  audits: schemas.AuditLog,
  applications: schemas.Application,
  teams: schemas.Team,
  scenes: schemas.Scene,
  infraDownstreams: schemas.InfraDownstream,
});

function mapRecordType(value, key) {
  const recordType = recordTypes.get(key);
  return new Immutable.Map(value).map(recordType);
}

export default function entity(state = initialState, action) {
  const { entities } = action;
  if (entities) {
    return state.mergeDeep(new Immutable.Map(entities).map(mapRecordType));
  }
  return state;
}

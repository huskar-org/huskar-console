import { combineReducers } from 'redux';
import minimal from './minimal';
import user from './user';
import application from './application';
import preference from './preference';
import entity from './entity';
import audit from './audit';
import alarm from './alarm';
import snooze from './snooze';
import infraConfig from './infra-config';
import infraConnective from './infra-connective';
import infraDownstream from './infra-downstream';
import instance from './instance';
import serviceInfo from './serviceinfo';
import privilege from './privilege';
import releaseWindow from './releaseWindow';
import serviceRoute from './service-route';
import wellKnown from './well-known';

const reducer = combineReducers({
  minimal,
  user,
  application,
  preference,
  entity,
  audit,
  alarm,
  snooze,
  infraConfig,
  infraConnective,
  infraDownstream,
  instance,
  serviceInfo,
  privilege,
  releaseWindow,
  serviceRoute,
  wellKnown,
});

export default reducer;
